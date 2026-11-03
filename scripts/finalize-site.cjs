/* Finish ALL published HTML pages after content generation.
 * One shared reader and navigation without modifying the original essay prose.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
function pages(dir){const found=[];for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(ent.name.startsWith('.'))continue;const p=path.join(dir,ent.name);if(ent.isDirectory())found.push(...pages(p));else if(ent.isFile()&&p.endsWith('.html'))found.push(p)}return found}
function inject(html,relative){
 if(!/<\/head>/i.test(html)||!/<body\b/i.test(html))throw Error('Malformed publishable HTML: missing head/body');
 const article=relative.startsWith('articles/');
 const prefix=article?'../':'';
 const assets=article?['shared-navigation.css','text-first-site.css','shared-navigation.js']:['text-first-site.css'];
 let updated=html;
 for(const file of assets)if(!updated.includes('href="'+prefix+file+'"')&&!updated.includes('src="'+prefix+file+'"')){
  const tag=file.endsWith('.css')?'<link rel="stylesheet" href="'+prefix+file+'">':'<script src="'+prefix+file+'" defer></script>';
  updated=updated.replace(/<\/head>/i,tag+'\n</head>');
 }
 updated=updated.replace(/<body\b([^>]*)>/i,(full,attrs)=>{
  const tag='mrl-text-first'+(article?' mrl-article-page':'');
  if(/\bclass\s*=\s*["']/.test(attrs))return '<body'+attrs.replace(/\bclass\s*=\s*(["'])([^"']*)\1/,(_,q,cls)=>'class='+q+cls+' '+tag+q)+'>';
  return '<body'+attrs+' class="'+tag+'">';
 });
 return updated;
}
function finalize(dir='_site'){
 const root=path.resolve(dir);if(!fs.existsSync(root))throw Error('Site directory missing: '+root);
 const list=pages(root);if(!list.length)throw Error('No HTML pages to finalize');
 for(const file of list){const rel=path.relative(root,file).replace(/\\/g,'/');const original=fs.readFileSync(file,'utf8');const next=inject(original,rel);fs.writeFileSync(file,next)}
 console.log('Applied text-first academic reader to '+list.length+' HTML pages');
 return list.length;
}
if(require.main===module)finalize(process.argv[2]||'_site');
module.exports={inject,finalize,pages};
