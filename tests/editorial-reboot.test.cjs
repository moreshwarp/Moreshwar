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
 assert.match(html,/class="mrl-reboot mrl-reference"/);
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
