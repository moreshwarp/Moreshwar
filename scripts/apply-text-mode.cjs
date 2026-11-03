/* One site-wide finishing pass after the existing scholarly article finalizer.
 * Makes root pages, stories, contact receipt, and all article routes visually consistent.
 * No content deletion; decorative images are suppressed by accessible CSS.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {listHtml}=require('./audit-site.cjs');
function stylePage(html,relative){
 if(!/<\/head>/i.test(html)||!/<body\b/i.test(html))throw Error('Incomplete HTML shell: '+relative);
 const article=relative.startsWith('articles/');
 const prefix=article?'../':'';
 const extras=['text-first-site.css'];
 if(!article && !html.includes('shared-navigation.js'))extras.push('shared-navigation.css','shared-navigation.js');
 let output=html;
 for(const asset of extras){
  const address=prefix+asset;
  if(output.includes('href="'+address+'"')||output.includes('src="'+address+'"'))continue;
  const tag=asset.endsWith('.css')?'<link rel="stylesheet" href="'+address+'">':'<script defer src="'+address+'"></script>';
  output=output.replace(/<\/head>/i,tag+'\n</head>');
 }
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
 if(files.length<30)throw Error('Expected complete published site (30+ pages), found '+files.length);
 for(const file of files){
  const name=path.relative(root,file).split(path.sep).join('/');
  const initial=fs.readFileSync(file,'utf8'),next=stylePage(initial,name);
  if(next!==initial)fs.writeFileSync(file,next);
 }
 console.log('Applied uniform text-first layout to all '+files.length+' published HTML pages');
 return files.length;
}
if(require.main===module)apply(process.argv[2]||'_site');
module.exports={stylePage,apply};
