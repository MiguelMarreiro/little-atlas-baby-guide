import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),data={};
for(const n of ['products','evidence','sources','offers','history','status','fx','baskets'])data[n]=JSON.parse(await readFile(new URL(`data/${n}.json`,root),'utf8'));
for(const n of ['products','evidence','sources','offers','baskets']){const ids=data[n].map(x=>x.id);assert.equal(new Set(ids).size,ids.length,`Duplicate ${n} IDs`);}
const products=new Set(data.products.map(x=>x.id)),evidence=new Set(data.evidence.map(x=>x.id));
for(const p of data.products){assert.ok(p.url.startsWith('https://'));for(const id of p.evidenceIds)assert.ok(evidence.has(id),`Missing evidence ${id}`);}
for(const e of data.evidence){assert.ok(e.url.startsWith('https://'));for(const id of e.productIds)assert.ok(products.has(id),`Missing product ${id}`);}
for(const o of data.offers){assert.ok(products.has(o.productId),`Unknown offer product ${o.productId}`);assert.ok(o.url.startsWith('https://'));assert.ok(o.components.includes(o.productId),'Offer must include the product actually sold');assert.ok(['GBP','EUR'].includes(o.currency));assert.ok(o.price===null||(typeof o.price==='number'&&Number.isFinite(o.price)&&o.price>0));if(o.price!==null)assert.ok(o.checkedAt&&(o.verification==='retailer'||(o.condition==='used'&&o.verification==='marketplace')),'Unverified price may not be seeded as current');if(o.productId==='cot-s-lux')assert.equal(o.compatibility,'unresolved');}
for(const h of data.history){assert.ok(data.offers.some(o=>o.id===h.offerId));assert.ok(h.checkedAt);}
const text=JSON.stringify(data);
const privatePatterns=[/gh[porsu]_[A-Za-z0-9]{15,}/,/sk-proj-/i,/github_pat_[A-Za-z0-9_]+/,/-----BEGIN [A-Z ]*PRIVATE KEY-----/,/\[\d{1,2}\/\d{1,2}\/\d{2,4},? \d{1,2}:\d{2}(:\d{2})?\]/];
for(const pattern of privatePatterns)assert.ok(!pattern.test(text),'Private data found in public research');
assert.ok(!text.includes('/Users/'));
console.log(`Validated ${data.products.length} products, ${data.evidence.length} evidence records, ${data.offers.length} offers.`);
