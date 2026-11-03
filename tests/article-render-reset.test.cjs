const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {finalizeHtml}=require('../scripts/finalize-site.cjs'),{stylePage}=require('../scripts/apply-text-mode.cjs');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('legacy article dark theme is removed at publish stage without removing the writing',()=>{
 const article=read('articles/183772820-the-secret-link-between-sounding.html');
 assert.match(article,/moreshwar-theme-v1/);
 const published=finalizeHtml(article,{css:'123456789abc',js:'abc123abc123'});
 assert.match(published,/<body class="sch-reader"/);
 assert.match(published,/article-unified\.css\?v=123456789abc/);
 assert.match(published,/article-unified\.js\?v=abc123abc123/);
 assert.doesNotMatch(published,/<style(?:\s[^>]*)?>/i);
 assert.doesNotMatch(published,/moreshwar-theme-v1|color-scheme:dark|#080e16/);
 assert.match(published,/<meta name="theme-color" content="#ffffff">/);
 assert.match(published,/The Secret Link Between/);
 assert.match(published,/<main class="shell">/);
 assert.equal((published.match(/article-unified\.css/g)||[]).length,1);
});
test('generated scholarly fieldnotes also shed legacy dark CSS',()=>{
 const original=read('articles/fieldnote-queues.html');
 const published=finalizeHtml(original,{css:'abc123',js:'def456'});
 assert.match(published,/Why Queues Make Fast Systems Feel Slow/);
 assert.doesNotMatch(published,/<style(?:\s[^>]*)?>/i);
 assert.match(published,/article-unified\.css\?v=abc123/);
});
test('cache versions apply to final reader sheet, while readable content is preserved',()=>{
 const html='<!doctype html><html><head></head><body><main><h1>Original scientific claim</h1></main></body></html>';
 const first=stylePage(html,'articles/testing.html','deadbeef1234');
 assert.match(first,/href="\.\.\/text-first-site\.css\?v=deadbeef1234"/);
 assert.match(first,/Original scientific claim/);
 assert.equal((stylePage(first,'articles/testing.html','deadbeef1234').match(/text-first-site\.css/g)||[]).length,1);
 const rootPage=stylePage(html,'index.html','deadbeef1234');
 assert.match(rootPage,/href="text-first-site\.css\?v=deadbeef1234"/);
});
