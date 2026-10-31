const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('new homepage has accessible landmarks and interactive bookshelf',()=>{
 const html=read('index.html');
 for(const id of ['main-content','hero-title','nav','menu','bookshelf','shelf-toggle','shelf-panel','shelf-search','shelf-list','shelf-count']){
   assert.match(html,new RegExp('id="'+id+'"'),'missing '+id);
 }
 assert.match(html,/<main\b/);
 assert.match(html,/aria-expanded="false"/);
 assert.match(html,/research-method\.svg/);
 assert.match(html,/href="reading-archive\.html"/);
 assert.match(html,/href="classic\.html#systems-lab"/);
 assert.match(html,/social-preview\.png\?v=3/);
});
test('all 22 published archive entries remain, with filtering controls',()=>{
 const html=read('reading-archive.html');
 assert.equal((html.match(/class="story"/g)||[]).length,22);
 assert.match(html,/id="q"/);
 assert.match(html,/id="year"/);
 assert.match(html,/id="empty"/);
 assert.doesNotMatch(html,/Review-only monochrome/);
});
test('web preview and diagram assets are actual published files',()=>{
 const data=fs.readFileSync(path.join(root,'social-preview.png'));
 assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(data.readUInt32BE(16),1200);
 assert.equal(data.readUInt32BE(20),630);
 for(const p of ['favicon.svg','research-method.svg','mrl-reboot.css'])assert.ok(fs.statSync(path.join(root,p)).size>200,p);
 for(const p of ['.github/workflows/pages.yml','.github/workflows/browser-qa.yml']){
  const yaml=read(p);
  for(const asset of ['favicon.svg','social-preview.png','research-method.svg','mrl-reboot.css'])
   assert.ok(yaml.includes(asset),p+' missing '+asset);
 }
});
test('legacy lab remains accessible and points to the real studio',()=>{
 const lab=read('classic.html');
 assert.match(lab,/id="systems-lab"/);
 assert.match(lab,/href="studio\.html"/);
 assert.doesNotMatch(lab,/design\/editorial-review-only-20261020\/studio\.html/);
});

test('editorial reference styling is original, accessible and published',()=>{
 const html=read('index.html');
 const css=read('atelier.css');
 assert.match(html,/class="mrl-reboot mrl-reference mrl-mobile"/);
 assert.match(html,/href="atelier\.css"/);
 assert.match(html,/class="at-hero"/);
 assert.match(html,/class="at-feature"/);
 assert.match(html,/class="at-method-grid"/);
 assert.match(html,/aria-label="Primary navigation"/);
 assert.match(html,/aria-controls="nav"/);
 assert.match(css,/@media\(max-width:510px\)/);
 assert.match(css, /prefers-reduced-motion:reduce/);
 assert.match(css, /:focus-visible/);
 assert.doesNotMatch(html, /anthropic\.com|Claude|ANTHROPIC/);
 for(const page of ['studio.html','reading-archive.html'])assert.match(read(page),/href="atelier\.css"/);
 for(const workflow of ['.github/workflows/pages.yml','.github/workflows/browser-qa.yml'])
  assert.match(read(workflow),/atelier\.css/);
});


test('mobile-first UI is real on every journal entry page',()=>{
 const home=read('index.html'),archive=read('reading-archive.html'),studio=read('studio.html');
 for(const [name,html] of [['homepage',home],['archive',archive],['studio',studio]]){
  assert.match(html,/mobile-first\.css/,name+' missing responsive styles');
  assert.match(html,/mobile-first\.js/,name+' missing search script');
  assert.match(html,/mrl-bottom-nav/,name+' missing mobile navigation');
  assert.match(html,/data-mrl-search/,name+' missing usable search entry');
  assert.match(html,/class="[^"]*mrl-mobile/,name+' missing mobile class');
 }
 assert.match(home,/mrl-jump-grid/);
 assert.match(home,/href="index\.html#bookshelf"/);
 assert.match(home,/href="reading-archive\.html"/);
 assert.match(home,/href="studio\.html"/);
 assert.match(archive,/data-mrl-query="netflix"/);
 assert.match(archive,/data-mrl-query=""/);
 const css=read('mobile-first.css'),script=read('mobile-first.js');
 assert.match(css,/max-width:370px/);
 assert.match(css,/min-width:761px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(script,/new DOMParser/);
 assert.match(script,/bookshelf\.json/);
 assert.match(script,/aria-live/);
 assert.doesNotMatch(script,/https:\/\/[^'"]+\.js/);
 for(const workflow of ['.github/workflows/pages.yml','.github/workflows/browser-qa.yml']){
  const content=read(workflow);
  assert.ok(content.includes('mobile-first.css mobile-first.js'),workflow+' missing shipped assets');
  assert.match(content,/test -s _site\/mobile-first\.css/);
  assert.match(content,/test -s _site\/mobile-first\.js/);
 }
});
