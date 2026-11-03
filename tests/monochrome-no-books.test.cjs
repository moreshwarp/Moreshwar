const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const {sourceFiles,requiredFiles}=require('../scripts/prepare-site.cjs');
test('Books module and catalog are absent from published site',()=>{
 assert.ok(!sourceFiles.includes('bookshelf.json'));
 assert.ok(!requiredFiles.includes('bookshelf.json'));
 for(const page of ['index.html','studio.html','reading-archive.html']){
  const html=read(page);
  assert.doesNotMatch(html,/href=["'][^"']*(?:#bookshelf|#reading-desk)["']/i,page);
 }
 const home=read('index.html');
 for(const id of ['bookshelf','reading-desk','shelf-toggle','ux-featured-books','shelf-search'])assert.ok(!home.includes('id="'+id+'"'),id);
 for(const script of ['mobile-first.js','research-ux.js','article-unified.js','heritage-unified.js','shared-navigation.js']){
  assert.doesNotMatch(read(script),/bookshelf\.json|#bookshelf|#reading-desk|covers\.openlibrary\.org/);
 }
 assert.doesNotMatch(read('mobile-first.js'),/bookResponse|bookQuery|kind:'Book'/);
});
test('Four top-level navigation tabs are Home, Research, Writing, About',()=>{
 const nav=read('shared-navigation.js');
 for(const dest of ['index.html','studio.html','reading-archive.html','index.html#about-profile'])assert.ok(nav.includes('href="'+dest+'"'),dest);
 assert.equal((nav.match(/<a href=/g)||[]).length,4);
 assert.match(nav,/href="index\.html">Home<\/a>/);
 assert.doesNotMatch(nav,/mrl-site-single|label:'Reading'/);
 const article=read('article-unified.js');
 assert.match(article,/Research/);assert.match(article,/Writing/);assert.match(article,/About/);
 assert.doesNotMatch(article,/href="\.\.\/index\.html#bookshelf"/);
});
test('Neutral monochrome themes use accessible soft maroon links',()=>{
 const css=read('text-first-site.css'),article=read('article-unified.css');
 for(const value of ['--site-paper:#ffffff','--site-ink:#171717','--site-link:#965262','--site-paper:#111111','--site-link:#d8a3b1','--site-button:#171717']){
  assert.ok(css.includes(value),value);
 }
 assert.match(css,/html\[data-theme="dark"\]/);
 assert.ok(article.includes('--sch-reader-link:#965262'));
 assert.ok(article.includes('--sch-reader-link:#d8a3b1'));
});
