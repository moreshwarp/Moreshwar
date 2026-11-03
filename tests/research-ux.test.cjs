const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('design system and progressive UX assets ship on all reading pages',()=>{
 const {sourceFiles,requiredFiles}=require('../scripts/prepare-site.cjs');
 for(const asset of ['research-ux.css','research-ux.js']){assert.ok(sourceFiles.includes(asset));assert.ok(requiredFiles.includes(asset));assert.ok(fs.statSync(path.join(root,asset)).size>1000)}
 for(const page of ['index.html','reading-archive.html','studio.html']){assert.match(read(page),/research-ux\.css/);assert.match(read(page),/research-ux\.js/)}
});
test('book showcase and remote cover requests are removed from public UI',()=>{
 const js=read('research-ux.js'),html=read('index.html');
 assert.doesNotMatch(html,/id="bookshelf"|id="reading-desk"|id="ux-featured-books"|id="shelf-toggle"/);
 assert.doesNotMatch(js,/covers\.openlibrary\.org|ux-book-cover|shelf-list/);
 assert.ok(!require('../scripts/prepare-site.cjs').sourceFiles.includes('bookshelf.json'));
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
