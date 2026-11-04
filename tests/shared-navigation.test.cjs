const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
test('all primary pages expose the same four top-level links',()=>{
 for(const page of ['index.html','studio.html','reading-archive.html']){
  const nav=read(page).match(/<nav class="site-navigation"[\\s\\S]*?<\\/nav>/)?.[0];
  assert.ok(nav,page);
  const links=[...nav.matchAll(/<a href="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(links,page==='index.html'?['index.html','studio.html','reading-archive.html','#about-profile']:['index.html','studio.html','reading-archive.html','index.html#about-profile'],page);
  assert.equal((nav.match(/aria-current="page"/g)||[]).length,1,page);
 }
});
test('Writing archive retains 22 entries, keyboard-accessible filters and local links',()=>{
 const html=read('reading-archive.html');
 assert.equal((html.match(/class="story"/g)||[]).length,22);
 for(const id of ['q','year','count','empty'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/addEventListener\\('input',filter\\)/);
 assert.match(html,/addEventListener\\('change',filter\\)/);
 assert.doesNotMatch(html,/href="https:\/\/moreshwarp\\.github\\.io\/Moreshwar\/articles\//);
});
test('articles have home, research, writing and about without a book section',()=>{
 const js=read('article-unified.js');
 for(const label of ['Research','Writing','About'])assert.ok(js.includes(label));
 assert.doesNotMatch(js,/#bookshelf|Book catalog/);
});
