const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('design system and progressive UX assets ship on all reading pages',()=>{
 const {sourceFiles,requiredFiles}=require('../scripts/prepare-site.cjs');
 for(const asset of ['research-ux.css','research-ux.js']){assert.ok(sourceFiles.includes(asset));assert.ok(requiredFiles.includes(asset));assert.ok(fs.statSync(path.join(root,asset)).size>1000)}
 for(const page of ['index.html','reading-archive.html','studio.html']){assert.match(read(page),/research-ux\.css/);assert.match(read(page),/research-ux\.js/)}
});
test('featured real cover editions have verified ISBNs and no invented universal covers',()=>{
 const js=read('research-ux.js'),html=read('index.html');
 assert.match(html,/id="ux-featured-books"/);
 assert.match(js,/9780135957059/);
 assert.match(js,/9781544514215/);
 assert.match(js,/9781455586691/);
 assert.match(js,/covers\.openlibrary\.org\/b\/isbn/);
 assert.match(js,/default=false/);
 assert.match(js,/Cover unavailable/);
 assert.match(js,/Cover not verified/);
 assert.doesNotMatch(js,/faker|randomCover|unsplash|bookcover\.generate/i);
 const books=JSON.parse(read('bookshelf.json')).books;
 for(const title of ['The Pragmatic Programmer','The Almanack of Naval Ravikant','Deep Work'])assert.ok(books.some(b=>b.title===title),title);
 assert.equal(books.length,143);
});
test('meaningful system figure can be zoomed with a keyboard-operable dialog',()=>{
 const html=read('index.html'),js=read('research-ux.js'),svg=read('assets/distributed-request-flow.svg');
 assert.match(html,/data-ux-zoom="assets\/distributed-request-flow\.svg"/);
 assert.match(js,/dialog\.showModal\(\)/);
 assert.match(js,/dialog\.addEventListener\('close'/);
 assert.match(svg,/Replica A/);
 assert.match(svg,/Replica B/);
 assert.match(svg,/Timeout \/ retry path/);
 assert.match(svg,/Conceptual teaching model/);
});
test('scroll, reduced-motion, semantic theme and button tokens remain consistent',()=>{
 const css=read('research-ux.css'),js=read('research-ux.js');
 assert.match(css,/--ux-radius:12px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/scroll-behavior:auto!important/);
 assert.match(js,/IntersectionObserver/);
 assert.match(js,/requestAnimationFrame/);
 assert.match(js,/aria-label/);
 assert.match(js,/prefers-color-scheme: dark/);
 assert.match(js,/readTheme\(\)/);
 assert.match(css,/\[data-theme=dark\]/);
});
