import test from 'node:test';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { offerEligibility, basketTotal, convert } from '../lib/engine.mjs';
import { parseShopify, shopifyPageCurrency, parseJsonLd, robotsAllowed, fetchText, checkOffer, run } from '../scripts/update.mjs';
const now = new Date('2026-11-01T12:00:00Z');
const base = (extra = {}) => ({ id:'a', productId:'seat', retailer:'Shop', seller:'Shop', price:100, currency:'GBP', condition:'new', compatibility:'verified', verification:'retailer', stock:'in_stock', checkedAt:now.toISOString(), components:['seat'], destinations:{GB:{shipping:5,shippingVerified:true,charges:0,freeShippingThreshold:150}}, ...extra });
test('eligibility requires current confirmed new compatible retailer offer and known delivery costs', () => {
  assert.equal(offerEligibility(base(), 'GB', now).eligible, true);
  for (const extra of [{checkedAt:'2026-10-30T23:59:59Z'}, {stock:'unknown'}, {price:null}, {compatibility:'unresolved'}, {condition:'used'}, {verification:'discovery'}, {destinations:{GB:{shipping:0,shippingVerified:true,charges:null}}}, {destinations:{GB:{shipping:null,shippingVerified:false,charges:0}}}]) assert.equal(offerEligibility(base(extra), 'GB', now).eligible, false);
});
test('group shipping once per retailer and currency, applying free threshold', () => {
  const result = basketTotal([base(), base({id:'b',price:60,components:['base']})], 'GB', now, {requiredComponents:['seat','base']});
  assert.equal(result.total,160); assert.equal(result.groups.length,1); assert.equal(result.groups[0].shipping,0);
  assert.equal(basketTotal([base({price:149})], 'GB', now).total,154);
});
test('coupons ignore conditional, unverified and expired claims', () => {
  for (const flags of [{conditional:true}, {verified:false}, {expiresAt:'2026-10-31'}]) {
    const promotion = {code:'SAVE', amount:10,kind:'percent',expiresAt:'2026-12-01',verified:true,conditional:false,...flags};
    assert.equal(basketTotal([base({promotion})], 'GB', now).total,105);
  }
  const promotion = {code:'SAVE',amount:10,kind:'percent',expiresAt:'2026-12-01',verified:true,conditional:false};
  assert.equal(basketTotal([base({promotion})], 'GB', now).total,95);
  assert.equal(basketTotal([base({quantity:2,promotion:{...promotion,kind:'fixed'}})], 'GB', now).total,190);
  assert.equal(basketTotal([base({promotion:{...promotion,kind:'fixed'}}),base({id:'b',components:['base'],promotion:{...promotion,code:'OTHER',kind:'fixed'}})], 'GB', now).total,190);
  assert.equal(basketTotal([base({promotion:{...promotion,kind:'fixed'}}),base({id:'b',components:['base'],promotion:{...promotion,kind:'fixed'}})], 'GB', now).total,190);
});
test('coverage and quantities are exact; overlapping bundle components invalidate total', () => {
  assert.equal(basketTotal([base({components:['seat','base']}),base({id:'b',components:['base']})], 'GB', now).total,null);
  assert.equal(basketTotal([base()], 'GB', now, {requiredComponents:['seat','base']}).eligible,false);
  assert.equal(basketTotal([base({quantity:2})], 'GB', now, {requiredComponents:{seat:2}}).total,200);
  assert.equal(basketTotal([base({quantity:2})], 'GB', now, {requiredComponents:{seat:1}}).eligible,false);
  assert.equal(basketTotal([base(),base()], 'GB', now).eligible,false);
});
test('currency conversion requires actual dated ECB rates and never combines currencies implicitly', () => {
  const fx = {base:'EUR',date:'2026-10-30',rates:{EUR:1,GBP:0.8}};
  assert.equal(convert(80,'GBP','EUR',fx,new Date('2026-10-31T00:00:00Z')),100); assert.equal(convert(100,'EUR','GBP',fx,new Date('2026-10-31T00:00:00Z')),80);
  assert.equal(convert(100,'EUR','GBP',{}),null);
  assert.equal(convert(100,'EUR','GBP',fx,new Date('2026-11-08T00:00:00Z')),null);
  assert.equal(convert(100,'GBP','GBP',fx,new Date('2026-11-08T00:00:00Z')),100);
  const items = [base(), base({id:'b',currency:'EUR',components:['base']})];
  assert.equal(basketTotal(items,'GB',now).total,null);
  const result = basketTotal(items,'GB',now,{fx,outputCurrency:'EUR'});
  assert.equal(result.total,236.25); assert.equal(result.groups.length,2);
});
const shopify = JSON.stringify({title:'Seat',currency:'GBP',variants:[{id:1,title:'Black',price:10000,available:true},{id:2,title:'Blue',price:9000,available:false}]});
test('Shopify never selects a cheapest or default variant', () => {
  assert.throws(() => parseShopify(shopify,{currency:'GBP'}),/identifier/);
  assert.throws(() => parseShopify(shopify,{currency:'GBP',variantId:'9'}),/missing/);
  assert.throws(() => parseShopify(shopify,{currency:'GBP',variantId:'1',expectedVariant:'Blue'}),/missing/);
  assert.throws(() => parseShopify(shopify,{currency:'GBP',variantId:'1',expectedTitle:'Different seat'}),/mismatch/);
  assert.deepEqual(parseShopify(shopify,{currency:'GBP',variantId:'2',expectedVariant:'Blue'}),{price:90,stock:'out_of_stock'});
});
const ld = product => `<script type="application/ld+json">${JSON.stringify(product)}</script>`;
const product = {'@type':'Product',name:'Seat',sku:'exact-black',offers:{'@type':'Offer',price:'100.00',priceCurrency:'GBP',availability:'https://schema.org/InStock'}};
test('JSON-LD requires exact product identity and rejects ambiguous offers or currency', () => {
  assert.throws(() => parseJsonLd(ld(product),{currency:'GBP'}),/GTIN or SKU/);
  assert.throws(() => parseJsonLd(ld(product),{currency:'GBP',expectedSku:'wrong'}),/missing/);
  assert.throws(() => parseJsonLd(ld({...product,offers:[product.offers,product.offers]}),{currency:'GBP',expectedSku:'exact-black'}),/ambiguous/);
  assert.throws(() => parseJsonLd(ld(product),{currency:'EUR',expectedSku:'exact-black'}),/Currency/);
  assert.deepEqual(parseJsonLd(ld(product),{currency:'GBP',expectedSku:'exact-black'}),{price:100,stock:'in_stock'});
});
test('robots disallow is respected including specific allow override', () => {
  const robots = 'User-agent: *\nDisallow: /products/\nAllow: /products/public\n';
  assert.equal(robotsAllowed(robots,'https://shop.test/products/private'),false);
  assert.equal(robotsAllowed(robots,'https://shop.test/products/public.js'),true);
});
test('HTTP 403 or 429 does not retry or bypass; robots rejection avoids product request', async () => {
  let calls = 0;
  await assert.rejects(fetchText('https://shop.test',async () => {calls++;return new Response('',{status:403});}),/403/);
  assert.equal(calls,1); calls=0;
  await assert.rejects(checkOffer({parser:'shopify',url:'https://shop.test/products/a',variantId:'1'},async () => {calls++;return new Response('User-agent: *\nDisallow: /products/');}),/disallow/);
  assert.equal(calls,1);
});

test('Shopify requires explicit same-locale currency proof and rejects mismatches', async () => {
  const unknown = JSON.stringify({...JSON.parse(shopify),currency:undefined});
  assert.throws(() => parseShopify(unknown,{currency:'GBP',variantId:'1'}), /unproven/);
  assert.throws(() => parseShopify(unknown,{currency:'GBP',variantId:'1'},'EUR'), /mismatch/);
  assert.equal(parseShopify(unknown,{currency:'GBP',variantId:'1'},'GBP').price,100);
  assert.equal(shopifyPageCurrency('<script>Shopify.currency = {"active":"GBP","rate":"1.0"};</script>',{}),'GBP');
  assert.throws(() => shopifyPageCurrency('<div>GBP</div><script>var unrelated={"active":"GBP"};</script>',{}), /unproven/);
  assert.throws(() => shopifyPageCurrency('<script>Shopify.currency = {"active":"GBP"};Shopify.currency = {"active":"EUR"};</script>',{}), /Conflicting/);
  const responses = url => new Response(url.endsWith('robots.txt') ? 'User-agent: *\nAllow: /' : url.endsWith('.js') ? unknown : '<script>Shopify.currency = {"active":"GBP"};</script>');
  assert.equal((await checkOffer({parser:'shopify',url:'https://shop.test/en-gb/products/seat',endpoint:'https://shop.test/en-gb/products/seat.js',currency:'GBP',variantId:'1'},async url => responses(url))).price,100);
});
test('marketplace sellers cannot share a shipping threshold or shipping charge', () => {
  const result = basketTotal([base(),base({id:'b',seller:'Other seller',components:['base']})],'GB',now);
  assert.equal(result.groups.length,2);
  assert.equal(result.total,210);
});
test('remote source failures preserve display prices and success timestamps, and record warning runs', async () => {
  const dir = await mkdtemp(join(tmpdir(),'baby-guide-test-'));
  try {
    const offer = base({parser:'shopify',url:'https://shop.test/products/seat',variantId:'1',monitoring:'candidate'});
    await writeFile(join(dir,'offers.json'),JSON.stringify([offer]));
    await writeFile(join(dir,'status.json'),JSON.stringify({customField:'preserved',lastSuccessAt:'2026-10-01T00:00:00Z',runs:Array.from({length:30},()=>({at:'old'}))}));
    const result = await run(dir,{fetcher:async () => new Response('',{status:403})});
    const [offers,status] = await Promise.all(['offers.json','status.json'].map(async name=>JSON.parse(await readFile(join(dir,name),'utf8'))));
    assert.equal(result.successes,0);
    assert.equal(offers[0].price,100); assert.equal(offers[0].checkedAt,offer.checkedAt);
    assert.equal(offers[0].monitoring,'candidate'); assert.match(offers[0].lastError,/403/);
    assert.equal(status.lastSuccessAt,'2026-10-01T00:00:00Z'); assert.equal(status.customField,'preserved');
    assert.equal(status.health,'warning'); assert.equal(status.runs.length,30);
    assert.equal(status.runs.at(-1).failed,1); assert.equal(status.runs.at(-1).errors.length,2);
    assert.equal(offerEligibility({...offers[0],stock:'unknown'},'GB',now).eligible,false);
    assert.equal(offers[0].price,100);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('best basket compares bundles and split-store shipping; incomplete coverage cannot win', async()=>{
 const {bestBasket}=await import('../lib/engine.mjs');
 const date='2026-11-01T12:00:00Z';
 const make=(id,components,price,retailer,shipping)=>({id,productId:components[0],components,price,retailer,seller:retailer,currency:'GBP',condition:'new',compatibility:'verified',verification:'retailer',stock:'in_stock',checkedAt:date,destinations:{GB:{shipping,shippingVerified:true,charges:0}}});
 const items=[make('a',['frame'],80,'one',20),make('b',['cot'],40,'two',20),make('bundle',['frame','cot'],130,'three',0)];
 assert.equal(bestBasket(items,'GB',['frame','cot'],date).result.total,130);
 assert.deepEqual(bestBasket(items,'GB',['frame','cot'],date).result.offerIds,['bundle']);
 assert.equal(bestBasket(items,'GB',['frame','cot','base'],date).found,false);
});
