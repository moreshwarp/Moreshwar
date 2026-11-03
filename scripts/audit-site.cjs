/* Strict local-link and asset integrity audit over the exact generated GitHub Pages site.
 * No external HTTP required. Fail on missing files and real, non-empty broken anchors.
 * External destinations are counted separately: network-dependent verification is not implied.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const HOST='https://moreshwarp.github.io',BASE='/Moreshwar/';
function listHtml(dir){const found=[];for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(item.isDirectory())found.push(...listHtml(path.join(dir,item.name)));else if(item.isFile()&&item.name.endsWith('.html'))found.push(path.join(dir,item.name))}return found}
function references(html){
 const tags=html.match(/<(?:a|link|script|img|source|iframe|video|audio|form)\b[^>]*>/gi)||[],found=[];
 for(const tag of tags){const name=tag.match(/^<([\w-]+)/)?.[1].toLowerCase()||'tag';
  for(const match of tag.matchAll(/\b(href|src|poster|action)\s*=\s*(["'])(.*?)\2/gi)){const value=match[3].trim();if(value)found.push({tag:name,attr:match[1].toLowerCase(),value})}
  const srcset=tag.match(/\bsrcset\s*=\s*(["'])(.*?)\1/i)?.[2];
  if(srcset)for(const candidate of srcset.split(',')){const first=candidate.trim().split(/\s+/)[0];if(first)found.push({tag:name,attr:'srcset',value:first})}
 }
 return found;
}
function check(dir='_site',options={}){
 const root=path.resolve(dir),htmlFiles=listHtml(root),errors=[],external=new Set(),all=[];
 if(!htmlFiles.length)throw Error('No HTML pages found in '+root);
 const ids=new Map();
 function anchors(file){if(ids.has(file))return ids.get(file);const h=fs.readFileSync(file,'utf8'),set=new Set();
  for(const m of h.matchAll(/\b(?:id|name)\s*=\s*(["'])(.*?)\1/gi))set.add(m[2]);
  ids.set(file,set);return set;
 }
 for(const file of htmlFiles){
  const rel=path.relative(root,file).split(path.sep).join('/'),h=fs.readFileSync(file,'utf8');
  const links=references(h);
  for(const link of links){
   const original=link.value;
   if(/^(mailto:|tel:|sms:|data:|blob:)/i.test(original))continue;
   if(/^javascript:/i.test(original)){errors.push(rel+': unsafe javascript: '+original);continue}
   let url;
   try{url=new URL(original,HOST+BASE+rel)}catch{errors.push(rel+': malformed URL '+original);continue}
   if(url.origin!==HOST){external.add(url.origin);continue}
   let publicPath=decodeURIComponent(url.pathname);
   if(publicPath==='/'||publicPath===BASE.slice(0,-1))publicPath=BASE;
   if(!publicPath.startsWith(BASE)){errors.push(rel+': link points outside Pages project '+original);continue}
   let local=publicPath.slice(BASE.length);
   if(!local||local.endsWith('/'))local+='index.html';
   if(local.includes('\0')||local.split('/').includes('..')){errors.push(rel+': invalid path '+original);continue}
   const candidate=path.resolve(root,local);
   if(!candidate.startsWith(root+path.sep)){errors.push(rel+': path escapes site '+original);continue}
   all.push({from:rel,to:local,href:original});
   if(!fs.existsSync(candidate)||!fs.statSync(candidate).isFile()){errors.push(rel+': missing local '+link.attr+' '+original);continue}
   if(url.hash && (link.tag==='a'||link.tag==='form') && candidate.endsWith('.html')){
    const id=decodeURIComponent(url.hash.slice(1));
    if(id && !anchors(candidate).has(id))errors.push(rel+': missing anchor #'+id+' in '+local+' referenced by '+original);
   }
  }
 }
 const report={pages:htmlFiles.length,localReferences:all.length,externalOrigins:[...external].sort(),errors,checkedAt:'build-time'};
 if(options.report)fs.writeFileSync(path.resolve(options.report),JSON.stringify(report,null,2)+'\n');
 console.log('Site audit: '+report.pages+' HTML pages, '+report.localReferences+' local references, '+external.size+' external origins, '+errors.length+' errors');
 if(errors.length)throw Error('Site audit failed:\n'+errors.slice(0,70).join('\n')+(errors.length>70?'\n...+'+(errors.length-70)+' errors':''));
 return report;
}
if(require.main===module)check(process.argv[2]||'_site',{report:process.argv[3]});
module.exports={check,references,listHtml};
