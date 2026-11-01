#!/usr/bin/env node
/** Bounded, fail-closed retailer checks. Run: node scripts/update.mjs [data-directory]. */
import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const LIMIT = 2 * 1024 * 1024;
const agent = 'BabyGuidePriceMonitor/1.0';
export async function fetchText(url, fetcher = fetch) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetcher(url, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': agent, Accept: 'application/json,text/html,application/xml,text/plain' }, redirect: 'error' });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.noRetry = [403, 429].includes(response.status);
        throw error;
      }
      if (Number(response.headers.get('content-length')) > LIMIT) throw new Error('Response exceeds 2 MB');
      let size = 0, parts = [];
      for await (const chunk of response.body) { size += chunk.length; if (size > LIMIT) { await response.body.cancel?.().catch(() => {}); throw new Error('Response exceeds 2 MB'); } parts.push(chunk); }
      return new TextDecoder().decode(Buffer.concat(parts));
    } catch (error) { if (error.noRetry || attempt === 1) throw error; }
  }
}
export function robotsAllowed(text, url) {
  const groups = []; let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim(); if (!line.includes(':')) continue;
    const [field, ...rest] = line.split(':'), value = rest.join(':').trim();
    if (field.toLowerCase() === 'user-agent') {
      if (!current || current.rules.length) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
    } else if (current && ['allow', 'disallow'].includes(field.toLowerCase()) && value) current.rules.push({ allow: field.toLowerCase() === 'allow', path: value });
  }
  const specific = groups.filter(g => g.agents.some(a => a !== '*' && agent.toLowerCase().includes(a)));
  const relevant = specific.length ? specific : groups.filter(g => g.agents.includes('*'));
  const path = new URL(url).pathname + new URL(url).search;
  const matching = relevant.flatMap(g => g.rules).filter(r => new RegExp('^' + r.path.split('*').map(p => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*').replace(/\\\$$/, '$')).test(path)).sort((a,b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return matching[0]?.allow ?? true;
}
const normalized = v => String(v ?? '').trim().toLowerCase();
export function parseShopify(text, offer, verifiedCurrency) {
  const product = JSON.parse(text);
  if (offer.expectedTitle && normalized(product.title) !== normalized(offer.expectedTitle)) throw new Error('Product title mismatch');
  if (!offer.variantId && !offer.expectedVariant) throw new Error('Exact variant identifier is required');
  const variants = (product.variants ?? []).filter(v => (!offer.variantId || String(v.id) === String(offer.variantId)) && (!offer.expectedVariant || normalized(v.public_title ?? v.title) === normalized(offer.expectedVariant)));
  if (variants.length !== 1) throw new Error('Exact variant missing or ambiguous');
  const variant = variants[0];
  if (typeof variant.price !== 'number' || !Number.isFinite(variant.price) || variant.price < 0) throw new Error('Invalid variant price');
  if (!product.currency && !verifiedCurrency) throw new Error('Shopify currency is unproven');
  if ((product.currency && product.currency !== offer.currency) || (verifiedCurrency && verifiedCurrency !== offer.currency)) throw new Error('Currency mismatch');
  return { price: variant.price / 100, stock: variant.available === true ? 'in_stock' : variant.available === false ? 'out_of_stock' : 'unknown' };
}
function flatten(value) {
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (value && typeof value === 'object') return [value, ...Object.values(value).filter(x => typeof x === 'object').flatMap(flatten)];
  return [];
}
export function parseJsonLd(text, offer) {
  if (!offer.gtin && !offer.expectedSku) throw new Error('Exact GTIN or SKU is required');
  const scripts = [...text.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const nodes = scripts.flatMap(m => flatten(JSON.parse(m[1])));
  const products = nodes.filter(n => (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]).includes('Product') && (!offer.expectedSku || String(n.sku) === String(offer.expectedSku)) && (!offer.gtin || ['gtin','gtin8','gtin12','gtin13','gtin14'].some(k => String(n[k]) === String(offer.gtin))));
  if (products.length !== 1) throw new Error('Exact product missing or ambiguous');
  const product = products[0];
  if (offer.expectedTitle && normalized(product.name) !== normalized(offer.expectedTitle)) throw new Error('Product title mismatch');
  const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
  if (offers.length !== 1 || !offers[0] || offers[0]['@type'] === 'AggregateOffer') throw new Error('Offer is missing or ambiguous');
  const result = offers[0];
  if (result.priceCurrency !== offer.currency) throw new Error('Currency mismatch');
  const price = typeof result.price === 'number' ? result.price : /^\d+(\.\d+)?$/.test(result.price) ? Number(result.price) : NaN;
  if (!Number.isFinite(price) || price < 0) throw new Error('Invalid price');
  return { price, stock: /(?:\/|:)InStock$/.test(result.availability) ? 'in_stock' : /(?:\/|:)(OutOfStock|SoldOut|Discontinued)$/.test(result.availability) ? 'out_of_stock' : 'unknown' };
}
/** Parse only the documented explicit JSON assignment inside a script; never execute retailer JS. */
export function shopifyPageCurrency(html, offer) {
  const found = [];
  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    const code = script[1];
    for (const match of code.matchAll(/(?:^|[;\n])\s*(?:window\.)?Shopify\.currency\s*=\s*/g)) {
      const start = match.index + match[0].length;
      if (code[start] !== '{') continue;
      let depth = 0, quoted = false, escaped = false;
      for (let i = start; i < code.length; i++) {
        const ch = code[i];
        if (quoted) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === '"') quoted = false; }
        else if (ch === '"') quoted = true;
        else if (ch === '{') depth++;
        else if (ch === '}' && --depth === 0) {
          try { const value = JSON.parse(code.slice(start, i + 1)); if (/^[A-Z]{3}$/.test(value.active)) found.push(value.active); } catch {}
          break;
        }
      }
    }
  }
  if (new Set(found).size > 1) throw new Error('Conflicting Shopify currency evidence');
  if (found.length) return found[0];
  if (offer.gtin || offer.expectedSku) { parseJsonLd(html, offer); return offer.currency; }
  throw new Error('Same-locale Shopify currency is unproven');
}
export async function checkOffer(offer, fetcher = fetch) {
  if (!['shopify','jsonld'].includes(offer.parser)) throw new Error('Manual check required');
  const target = new URL(offer.endpoint ?? offer.url), page = new URL(offer.url);
  if (target.protocol !== 'https:' || page.protocol !== 'https:' || target.origin !== page.origin) throw new Error('Only same-origin HTTPS retailer endpoints are supported');
  const robotText = await fetchText(new URL('/robots.txt', target).href, fetcher);
  if (!robotsAllowed(robotText, target.href) || !robotsAllowed(robotText, page.href)) throw new Error('Retailer robots rules disallow checking');
  const body = await fetchText(target.href, fetcher);
  if (offer.parser === 'shopify') {
    const html = await fetchText(page.href, fetcher);
    return parseShopify(body, offer, shopifyPageCurrency(html, offer));
  }
  return parseJsonLd(body, offer);
}
async function readJson(path, fallback) { try { return JSON.parse(await readFile(path, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return fallback; throw e; } }
async function save(path, data) { await writeFile(path + '.tmp', JSON.stringify(data, null, 2) + '\n'); await rename(path + '.tmp', path); }
export async function run(dataDir, { fetcher = fetch } = {}) {
  const offersPath = resolve(dataDir, 'offers.json'), offers = await readJson(offersPath, []);
  const statusPath = resolve(dataDir, 'status.json'), status = await readJson(statusPath, {});
  const historyPath = resolve(dataDir, 'history.json'), history = await readJson(historyPath, []);
  const now = new Date().toISOString(), errors = []; let cursor = 0, successes = 0, attempts = 0;
  const candidates = offers.filter(o => ['shopify','jsonld'].includes(o.parser) && o.monitoring !== 'manual').slice(0,30);
  await Promise.all(Array.from({length:2}, async () => {
    while (cursor < candidates.length) {
      const offer = candidates[cursor++]; attempts++; offer.lastAttemptAt = now;
      try {
        const result = await checkOffer(offer, fetcher);
        Object.assign(offer, result, { checkedAt: now, verification: 'retailer', monitoring: 'automatic', lastError: null });
        history.push({ offerId: offer.id, ...result, currency: offer.currency, checkedAt: now }); successes++;
      } catch (error) { offer.lastError = error.message; errors.push({ offerId: offer.id, error: error.message }); }
    }
  }));
  let fxSuccess = false;
  try {
    const xml = await fetchText('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', fetcher);
    const date = xml.match(/time=['"]([\d-]+)['"]/)?.[1];
    const rates = { EUR: 1 };
    for (const match of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) rates[match[1]] = Number(match[2]);
    if (!date || !Number.isFinite(rates.GBP) || rates.GBP <= 0) throw new Error('ECB response lacks dated GBP rate');
    await save(resolve(dataDir, 'fx.json'), { base: 'EUR', rates, date, checkedAt: now }); fxSuccess = true;
  } catch (error) { errors.push({ source: 'ECB', error: error.message }); }
  await save(offersPath, offers);
  await save(historyPath, history.filter(h => new Date(h.checkedAt).getTime() >= Date.now() - 365*86400000));
  await save(statusPath, { ...status, lastRunAt: now, ...(successes ? {lastSuccessAt: now} : {}), health: errors.length ? 'warning' : 'ok', runs: [...(Array.isArray(status.runs) ? status.runs : []), { at: now, attempted: attempts, succeeded: successes, failed: attempts - successes, errors }].slice(-30), counts: { attempted: attempts, succeeded: successes, failed: attempts - successes, deferred: Math.max(0, offers.filter(o => ['shopify','jsonld'].includes(o.parser) && o.monitoring !== 'manual').length - 30), fxSuccess }, errors });
  return { attempts, successes, errors };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(resolve(process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)), '../data'))).then(result => { console.log(JSON.stringify(result)); }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
