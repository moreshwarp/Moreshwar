const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('one academic design layer is installed on all main pages with a shared publishing manifest',()=>{
 const {sourceFiles,requiredFiles}=require('../scripts/prepare-site.cjs');
 for(const asset of ['heritage-unified.css','heritage-unified.js']){
  assert.ok(sourceFiles.includes(asset),asset);assert.ok(requiredFiles.includes(asset),asset);
  for(const page of ['index.html','reading-archive.html','studio.html'])assert.ok(read(page).includes(asset),page+' lacks '+asset);
 }
});
test('academic navigation is original, responsive, and preserves content and search',()=>{
 const css=read('heritage-unified.css'),js=read('heritage-unified.js');
 assert.match(css,/--sch-width:960px/);
 assert.match(css,/grid-template-rows:95px 48px/);
 assert.match(css,/mrl-site-header/);
 assert.match(css,/\.story/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(js,/sch-page-columns/);
 assert.match(js,/reading-archive\.html/);
 assert.match(js,/studio\.html/);
 assert.match(js,/aside\.setAttribute\('aria-label'/);
 assert.doesNotMatch(js,/fetch\(|localStorage|sessionStorage|analytics/);
 assert.doesNotMatch(css,/@import|https?:\/\//);
});
test('the original published essays and research destination ids stay in place',()=>{
 const home=read('index.html'),archive=read('reading-archive.html'),studio=read('studio.html'),lab=read('tests/fixtures/legacy-classic.html');
 assert.equal((archive.match(/class="story"/g)||[]).length,22);
 assert.ok(!require('../scripts/prepare-site.cjs').sourceFiles.includes('bookshelf.json'));
 for(const id of ['academic-directory','research-projects'])assert.ok(home.includes('id="'+id+'"'));
 for(const id of ['q','grid','year'])assert.ok(archive.includes('id="'+id+'"'));
 for(const id of ['systems-lab','inquiry'])assert.ok(lab.includes('id="'+id+'"'));
 assert.match(studio,/id="main-content"/);
});