import {readFile,writeFile} from 'node:fs/promises';
import {fetchText,robotsAllowed} from './update.mjs';
const data=new URL('../data/',import.meta.url), path=new URL('status.json',data);
const status=JSON.parse(await readFile(path,'utf8'));const now=new Date().toISOString();
const source='https://www.gov.uk/product-safety-alerts-reports-recalls.atom';
try{
 const robots=await fetchText('https://www.gov.uk/robots.txt');if(!robotsAllowed(robots,source))throw new Error('Robots rules do not permit this feed');
 const xml=await fetchText(source);if(!/<feed\b/.test(xml))throw new Error('Expected Atom feed');
 const entries=[...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/g)].map(m=>m[0]);
 const matches=entries.filter(s=>/cybex|thule|out.?n.?about|mountain.?buggy|cloud.?t|avi.?spin|nipper|urban.?glide/i.test(s)).map(s=>({title:s.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.replace(/<[^>]*>/g,'')||'Potential match',url:s.match(/<link[^>]*href="([^"]+)"/)?.[1]||source}));
 status.recalls={...status.recalls,lastAttemptAt:now,checkedAt:now,source,entriesChecked:entries.length,matches,state:matches.length?'review':'checked',message:`Checked ${entries.length} recent UK feed entries. ${matches.length} potential keyword matches. This feed is not the full historical database; EU Safety Gate remains a manual check.`};
}catch(e){status.recalls={...status.recalls,lastAttemptAt:now,source,state:'failed',error:e.message,message:'UK recall feed check failed. Previous results are retained; use the official search directly.'};}
await writeFile(path,JSON.stringify(status,null,2)+'\n');console.log(status.recalls.message);
