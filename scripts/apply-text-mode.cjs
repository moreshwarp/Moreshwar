/* One site-wide finishing pass after the existing scholarly article finalizer.
 * Makes root pages, stories, contact receipt, and all article routes visually consistent.
 * No content deletion; decorative images are suppressed by accessible CSS.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {listHtml}=require('./audit-site.cjs');
/* Normalize visible public brand across historical HTML at publication time.
 * Preserve permanent URLs and author bylines in article text. */
const PUBLIC_BRAND='Moreshwar Systems Lab';
function brandPublishedHtml(html){
 return String(html)
  .replace(/Moreshwar Research Lab/g,PUBLIC_BRAND)
  .replace(/Moreshwar \/ Lab/g,PUBLIC_BRAND)
  .replace(/Moreshwar Lab/g,PUBLIC_BRAND)
  .replace(/moreshwar\s*<span>\.<\/span>\s*\/\s*lab/gi,PUBLIC_BRAND)
  .replace(/m\s*<span>\.<\/span>\s*\/\s*lab/gi,PUBLIC_BRAND)
  .replace(/m\.\s*\/\s*lab/gi,PUBLIC_BRAND)
  .replace(/(<title>[^<]*?) — Moreshwar Pidadi(<\/title>)/gi,'$1 — '+PUBLIC_BRAND+'$2');
}
function stylePage(html,relative,version=''){
 html=brandPublishedHtml(html);
 // The research homepage is self-contained; do not inject legacy CSS or menus.
 // Pages that already ship the Systems Lab shell style themselves; the text-first reader
 // layer would fight their own stylesheet, so they are published as authored.
 if(html.includes('href="research-site.css"')||/href="(\.\.\/)?lab-site\.css/.test(html))return html;
 if(!/<\/head>/i.test(html)||!/<body\b/i.test(html))throw Error('Incomplete HTML shell: '+relative);
 const article=relative.startsWith('articles/');
 const prefix='../'.repeat(relative.split('/').length-1);
 const extras=['text-first-site.css'];
 // Reader layer: the owner sets the published default in site-settings.js; a visitor who has
 // chosen light or dark on the main pages keeps that choice while reading an article.
 const themeBootstrap='<script>(function(){try{var v=localStorage.getItem("mrl-research-theme");if(v==="light"||v==="dark"){document.documentElement.dataset.theme=v;document.documentElement.style.colorScheme=v;var m=document.querySelector(\'meta[name="theme-color"]\');if(m)m.content=v==="light"?"#F7F5F0":"#0D1014"}}catch(e){}})();<\/script>';
 if(!prefix && !html.includes('shared-navigation.js'))extras.push('shared-navigation.css','shared-navigation.js');
 let output=html;
 for(const asset of extras){
  const address=prefix+asset;
  const url=asset==='text-first-site.css'&&version?address+'?v='+version:address;
  if(output.includes('href="'+address+'"')||output.includes('href="'+address+'?')||output.includes('src="'+address+'"'))continue;
  const tag=asset.endsWith('.css')?'<link rel="stylesheet" href="'+url+'">':'<script defer src="'+address+'"></script>';
  output=output.replace(/<\/head>/i,tag+'\n</head>');
 }
 if(!output.includes('mrl-research-theme'))output=output.replace(/<\/head>/i,themeBootstrap+'\n</head>');
 output=output.replace(/<body\b([^>]*)>/i,(full,attr)=>{
   const additions=['mrl-text-first',...(article?['mrl-article-page']:[])];
   if(/\bclass\s*=\s*["']/.test(attr)){
    return '<body'+attr.replace(/\bclass\s*=\s*(["'])([^"']*)\1/i,(_,q,classes)=>{
      const tokens=new Set(classes.split(/\s+/).filter(Boolean));for(const c of additions)tokens.add(c);
      return 'class='+q+[...tokens].join(' ')+q;
    })+'>';
   }
   return '<body'+attr+' class="'+additions.join(' ')+'">';
 });
 return output;
}
function apply(dir='_site'){
 const root=path.resolve(dir),files=listHtml(root);
 const version=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'text-first-site.css'))).digest('hex').slice(0,12);
 if(files.length<30)throw Error('Expected complete published site (30+ pages), found '+files.length);
 for(const file of files){
  const name=path.relative(root,file).split(path.sep).join('/');
  const initial=fs.readFileSync(file,'utf8'),next=stylePage(initial,name,version);
  if(next!==initial)fs.writeFileSync(file,next);
 }
 console.log('Applied uniform text-first layout to all '+files.length+' published HTML pages');
 return files.length;
}
if(require.main===module)apply(process.argv[2]||'_site');
module.exports={stylePage,apply,brandPublishedHtml,PUBLIC_BRAND};
