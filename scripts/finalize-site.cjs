/* Publish every archive article with the shared academic reader.
 * Covers exported Substack pages, editorial fieldnotes, and generated Markdown notes.
 * Rewrites only known stale internal routes. Source files are untouched.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const oldRoutes=[
 [/href=(["'])\.\.\/(?:index\.html)?#home\1/g,'href="../index.html"'],
 [/href=(["'])\.\.\/(?:index\.html)?#writing\1/g,'href="../reading-archive.html"'],
 [/href=(["'])\.\.\/(?:index\.html)?#research\1/g,'href="../index.html#research-projects"'],
 [/href=(["'])\.\.\/(?:index\.html)?#systems-lab\1/g,'href="../classic.html#systems-lab"'],
 [/href=(["'])\.\.\/(?:index\.html)?#inquiry\1/g,'href="../classic.html#inquiry"'],
 [/href=(["'])\.\.\/(?:index\.html)?#contact\1/g,'href="../classic.html#contact"']
];
function finalizeHtml(html){
 if(!/<html\b/i.test(html)||!/<\/head>/i.test(html)||!/<body\b/i.test(html)||!/<\/body>/i.test(html))throw Error('Invalid article HTML shell');
 let out=html;
 for(const [pattern,target] of oldRoutes)out=out.replace(pattern,target);
 if(!out.includes('article-unified.css'))out=out.replace(/<\/head>/i,'<link rel="stylesheet" href="../article-unified.css">\n<script defer src="../article-unified.js"></script>\n</head>');
 if(!/class=["'][^"']*\bsch-reader\b/.test(out.match(/<body[^>]*>/i)?.[0]||'')){
  out=out.replace(/<body(\s[^>]*)?>/i,(tag,attrs='')=>{
   if(/\bclass\s*=/.test(attrs))return tag.replace(/\bclass\s*=(["'])([^"']*)\1/i,(_m,q,c)=>'class='+q+c+' sch-reader'+q);
   return '<body class="sch-reader"'+attrs+'>';
  });
 }
 return out;
}
function finalize(dir='_site'){
 const root=path.resolve(dir),articles=path.join(root,'articles');
 if(!fs.existsSync(articles))throw Error('Published articles directory missing: '+articles);
 const names=fs.readdirSync(articles).filter(n=>n.endsWith('.html'));if(names.length<22)throw Error('Expected at least 22 published articles, got '+names.length);
 for(const name of names){const file=path.join(articles,name);const previous=fs.readFileSync(file,'utf8'),current=finalizeHtml(previous);if(current!==previous)fs.writeFileSync(file,current)}
 const stories=path.join(root,'stories.html');
 if(fs.existsSync(stories)){const old=fs.readFileSync(stories,'utf8');const fixed=old.replace(/href=(["'])index\.html#story-of-the-day\1/g,'href="classic.html#story-of-the-day"');if(fixed!==old)fs.writeFileSync(stories,fixed)}
 for(const asset of ['article-unified.css','article-unified.js'])if(!fs.existsSync(path.join(root,asset)))throw Error('Missing reader asset '+asset);
 console.log('Unified '+names.length+' published articles with academic reading navigation');
 return names.length;
}
if(require.main===module)finalize(process.argv[2]||'_site');
module.exports={finalize,finalizeHtml};
