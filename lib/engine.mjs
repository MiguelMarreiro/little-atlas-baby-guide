/** Pure pricing rules shared by the guide and fixture tests. Unknown costs never become zero. */
export const MAX_PRICE_AGE_MS = 36 * 60 * 60 * 1000;
const money = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
const instant = value => value instanceof Date ? value.getTime() : new Date(value).getTime();
export function offerEligibility(offer, destination, now = new Date()) {
  const reasons = [];
  if (!money(offer.price)) reasons.push('Price is unknown');
  if (!['GBP', 'EUR'].includes(offer.currency)) reasons.push('Unsupported currency');
  if (offer.stock !== 'in_stock') reasons.push('Stock is not confirmed');
  if (offer.condition !== 'new') reasons.push('Only new products qualify');
  if (offer.compatibility !== 'verified') reasons.push('Compatibility is unresolved');
  if (offer.verification !== 'retailer') reasons.push('Exact retailer offer is unverified');
  const checked = offer.checkedAt ? instant(offer.checkedAt) : NaN;
  const time = instant(now);
  if (!Number.isFinite(checked) || !Number.isFinite(time) || checked > time + 300000 || time - checked > MAX_PRICE_AGE_MS) reasons.push('Price check is missing or older than 36 hours');
  const terms = offer.destinations?.[destination];
  if (!terms) reasons.push('Destination is unsupported');
  else {
    if (!terms.shippingVerified || !money(terms.shipping)) reasons.push('Shipping is unconfirmed');
    if (!money(terms.charges)) reasons.push('Import or other charges are unknown');
  }
  if (offer.quantity != null && (!Number.isInteger(offer.quantity) || offer.quantity < 1)) reasons.push('Quantity must be a positive integer');
  if (!Array.isArray(offer.components) || !offer.components.length || offer.components.some(x => typeof x !== 'string' || !x)) reasons.push('Bundle contents are unknown');
  return { eligible: reasons.length === 0, reasons };
}
export function convert(amount, from, to, fx, now = new Date()) {
  if (!money(amount)) return null;
  if (from === to) return round(amount);
  if (fx?.base !== 'EUR' || !fx.date || !money(fx.rates?.[from]) || !money(fx.rates?.[to]) || fx.rates[from] === 0 || fx.rates[to] === 0) return null;
  const rateDate = Date.parse(fx.date + 'T00:00:00Z');
  const currentTime = instant(now);
  if (!Number.isFinite(rateDate) || !Number.isFinite(currentTime) || rateDate > currentTime || currentTime - rateDate > 7 * 24 * 60 * 60 * 1000) return null;
  return round(amount / fx.rates[from] * fx.rates[to]);
}
function discount(offer, now) {
  const p = offer.promotion;
  if (!p || !p.verified || p.conditional || !p.expiresAt || instant(p.expiresAt) <= instant(now) || !Number.isFinite(instant(p.expiresAt)) || !money(p.amount)) return 0;
  if (p.kind === 'percent' && p.amount <= 100) return offer.price * p.amount / 100;
  if (p.kind === 'fixed') return Math.min(offer.price, p.amount);
  return 0;
}
/** requiredComponents accepts an array (duplicates mean quantities), or an id:quantity map. */
export function basketTotal(offers, destination, now = new Date(), { requiredComponents, fx, outputCurrency } = {}) {
  const reasons = [], buckets = new Map(), coverage = new Map(), offerIds = new Set();
  for (const offer of offers) {
    if (offerIds.has(offer.id)) reasons.push(`Duplicate offer: ${offer.id}`);
    offerIds.add(offer.id);
    reasons.push(...offerEligibility(offer, destination, now).reasons.map(r => `${offer.id}: ${r}`));
    const quantity = offer.quantity ?? 1;
    for (const id of offer.components ?? []) {
      const prior = coverage.get(id);
      if (prior && prior.offerId !== offer.id) reasons.push(`Overlapping bundle component: ${id}`);
      coverage.set(id, { offerId: offer.id, quantity: (prior?.quantity ?? 0) + quantity });
    }
    const key = `${offer.retailer}\u0000${offer.seller ?? offer.retailer}\u0000${offer.currency}`;
    if (!buckets.has(key)) buckets.set(key, { retailer: offer.retailer, seller: offer.seller ?? offer.retailer, currency: offer.currency, subtotal: 0, savings: 0, promotions: new Map(), terms: [] });
    const group = buckets.get(key);
    group.subtotal += (offer.price ?? 0) * quantity;
    // Apply a fixed code once per order, and combine codes only with verified stacking.
    const saving = discount(offer, now) * (offer.promotion?.kind === 'fixed' ? 1 : quantity);
    if (saving > 0) {
      const key = offer.promotion.code || offer.id, previous = group.promotions.get(key);
      group.promotions.set(key, { amount: offer.promotion.kind === 'fixed' ? Math.max(previous?.amount ?? 0, saving) : (previous?.amount ?? 0) + saving, stackable: offer.promotion.stackable === true && (!previous || previous.stackable) });
    }
    group.terms.push({ ...offer.destinations?.[destination], quantity });
  }
  if (!offers.length) reasons.push('Basket is empty');
  if (requiredComponents) {
    const required = Array.isArray(requiredComponents) ? requiredComponents.reduce((m, id) => (m[id] = (m[id] ?? 0) + 1, m), {}) : requiredComponents;
    for (const [id, quantity] of Object.entries(required)) if (!Number.isInteger(quantity) || quantity < 1 || coverage.get(id)?.quantity !== quantity) reasons.push(`Required component quantity is not covered: ${id}`);
    for (const id of coverage.keys()) if (!(id in required)) reasons.push(`Unexpected component: ${id}`);
  }
  const groups = [...buckets.values()].map(group => {
    const promotions = [...group.promotions.values()];
    group.savings = Math.max(promotions.filter(p => p.stackable).reduce((sum,p) => sum + p.amount, 0), ...promotions.filter(p => !p.stackable).map(p => p.amount), 0);
    const net = round(group.subtotal - group.savings);
    // Different product-specific delivery terms cannot silently inherit the cheapest shipping.
    const shipping = Math.max(...group.terms.map(t => t?.shippingVerified && money(t.shipping) ? money(t.freeShippingThreshold) && net >= t.freeShippingThreshold ? 0 : t.shipping : NaN));
    const charges = group.terms.reduce((sum, t) => sum + (money(t?.charges) ? t.charges * t.quantity : NaN), 0);
    return { retailer: group.retailer, seller: group.seller, currency: group.currency, subtotal: round(group.subtotal), savings: round(group.savings), shipping: Number.isFinite(shipping) ? shipping : null, charges: Number.isFinite(charges) ? charges : null, total: Number.isFinite(shipping + charges) ? round(net + shipping + charges) : null };
  });
  const currency = outputCurrency ?? groups[0]?.currency ?? null;
  let total = 0, savings = 0;
  for (const g of groups) {
    const converted = convert(g.total, g.currency, currency, fx, now), saving = convert(g.savings, g.currency, currency, fx, now);
    if (converted == null || saving == null) reasons.push(`Cannot convert ${g.currency} to ${currency} using available exchange rates`);
    else { total += converted; savings += saving; }
  }
  return { eligible: reasons.length === 0, reasons: [...new Set(reasons)], total: reasons.length ? null : round(total), currency, groups, savings: round(savings) };
}

/** Exhaustive exact-cover search for this small watchlist; never calls a partial search a winner. */
export function bestBasket(offers,destination,requiredComponents,now=new Date(),options={}) {
  const required=new Set(requiredComponents), candidates=offers.filter(o=>offerEligibility(o,destination,now).eligible&&o.components.every(id=>required.has(id)));
  let best=null, visits=0, truncated=false;
  function visit(selected,covered){if(++visits>50000){truncated=true;return;}const missing=requiredComponents.find(id=>!covered.has(id));if(!missing){const result=basketTotal(selected,destination,now,{...options,requiredComponents});if(result.eligible&&(!best||result.total<best.total))best={...result,offerIds:selected.map(o=>o.id)};return;}
    for(const o of candidates.filter(o=>o.components.includes(missing))){if(o.components.some(id=>covered.has(id)))continue;visit([...selected,o],new Set([...covered,...o.components]));if(truncated)return;}}
  visit([],new Set());return truncated?{found:false,truncated:true,result:null}:{found:!!best,truncated:false,result:best};
}
