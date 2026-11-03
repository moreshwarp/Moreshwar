/* Deep internal-link integrity audit against final GitHub Pages output.
 * Checks each shipped HTML route, its href/src/action targets and fragment ids.
 * External HTTP(S) destinations are recorded separately, not claimed verified.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {pages}=require('./finalize-site.cjs');
const decode=value=>String(value).replace(/&amp;/g,'&').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&quot;/g,'"');
function scan(rootDir){
 const root=path.resolve(rootDir);
 const files=pages(root);const ids=new Map(),issues=[],external=new Set();
 const rootURL='https://moreshwarp.github.io/Moreshwar/';
 for(const f of files){const relative=path.relative(root,f).replace(/\\/g,'/');const txt=fs.readFileSync(f,'utf8');ids.set(relative,new Set([...txt.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(m=>decode(m[1]))))}
 const paths=new Set();
 (function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile())paths.add(path.relative(root,p).replace(/\\/g,'/'))}})(root);
 const report=(page,kind,url,detail)=>issues.push({page,kind,url,detail});
 let inspected=0;
 for(const f of files){
  const page=path.relative(root,f).replace(/\\/g,'/');
  const txt=fs.readFileSync(f,'utf8');
  const re=/<(?:a|link|script|img|source|iframe|form|video|audio)\b[^>]*?\b(?:href|src|action)\s*=\s*(["'])(.*?)\1/gi;
  for(const match of txt.matchAll(re)){
   const raw=decode(match[2]).trim();
   if(!raw||raw.startsWith('data:')||raw.startsWith('blob:')||raw.startsWith('mailto:')||raw.startsWith('tel:'))continue;
   if(raw.toLowerCase().startsWith('javascript:')){report(page,'unsafe-url',raw,'javascript: URI');continue}
   let url;try{url=new URL(raw,new URL(page,rootURL))}catch{report(page,'malformed-url',raw,'URL parser rejected');continue}
   if(!['http:','https:'].includes(url.protocol))continue;
   if(url.origin!==new URL(rootURL).origin){external.add(url.origin);continue}
   if(!url.pathname.startsWith('/Moreshwar/')){report(page,'out-of-scope-url',raw,url.pathname);continue}
   inspected++;
   let target;
   try{target=decodeURIComponent(url.pathname.slice('/Moreshwar/'.length))}catch{report(page,'encoding',raw,'Invalid URL encoding');continue}
   target=target||'index.html';if(target.endsWith('/'))target+='index.html';
   if(!paths.has(target)){report(page,'missing-file',raw,target);continue}
   const fragment=url.hash?decodeURIComponent(url.hash.slice(1)):'';
   if(fragment&&target.endsWith('.html')&&!ids.get(target)?.has(fragment))report(page,'missing-anchor',raw,target+'#'+fragment);
  }
 }
 return {pages:files.length,localLinksInspected:inspected,externalHostsReferenced:external.size,issues};
}
function main(){const root=process.argv[2]||'_site',strict=process.argv.includes('--strict');const r=scan(root);console.log('Link audit: '+r.pages+' HTML pages, '+r.localLinksInspected+' local references, '+r.externalHostsReferenced+' external hosts (not contacted).');const counts={};for(const x of r.issues)counts[x.kind]=(counts[x.kind]||0)+1;console.log('Issues by type:',JSON.stringify(counts));for(const issue of r.issues.slice(0,120))console.log('LINK ISSUE',JSON.stringify(issue));if(r.issues.length>120)console.log('... and '+(r.issues.length-120)+' more');if(r.issues.length&&strict)process.exitCode=1;return r}
if(require.main===module)main();
module.exports={scan};
