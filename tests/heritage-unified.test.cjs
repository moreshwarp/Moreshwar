const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
test('homepage and companion pages use one stylesheet, one runtime, and a single header',()=>{
 for(const route of ['index.html','studio.html','reading-archive.html']){
  const html=read(route);
  assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1,route);
  assert.equal((html.match(/src="research-site\\.js"/g)||[]).length,1,route);
  assert.match(html,/href="research-site\\.css"/,route);
  assert.doesNotMatch(html,/heritage-unified\\.js|shared-navigation\\.js|mobile-first\\.js/);
  assert.equal((html.match(/class="site-header"/g)||[]).length,1,route);
  assert.equal((html.match(/aria-current="page"/g)||[]).length,1,route);
 }
});
test('research content is clear without unverified academic claims',()=>{
 const home=read('index.html');assert.match(home,/independent research notebook/);
 assert.match(home,/not claims of peer-reviewed/);assert.match(home,/id="research-projects"/);
 const studio=read('studio.html');assert.match(studio,/independent educational investigations/);
 assert.match(studio,/id="systems-lab"/);
});
