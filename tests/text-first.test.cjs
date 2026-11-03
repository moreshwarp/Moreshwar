const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {stylePage}=require('../scripts/apply-text-mode.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('all published HTML pages use one text-first design without changing writing',()=>{
 const html='<!doctype html><html><head><title>Research</title></head><body><main id="a"><h1>A</h1><p>Original evidence.</p></main></body></html>';
 const a=stylePage(html,'articles/example.html');
 assert.match(a,/mrl-text-first mrl-article-page/);
 assert.match(a,/\.\.\/text-first-site\.css/);
 assert.match(a,/Original evidence/);
 const rootPage=stylePage(html,'stories.html');
 assert.match(rootPage,/href="text-first-site\.css"/);
 assert.match(rootPage,/src="shared-navigation\.js"/);
 assert.equal((stylePage(rootPage,'stories.html').match(/href="text-first-site\.css"/g)||[]).length,1);
});
test('new style retains essential scientific controls while hiding old media',()=>{
 const css=read('text-first-site.css');
 assert.match(css,/mrl-article-page/);assert.match(css,/mrl-text-first/);
 assert.match(css,/img,picture,video/);
 assert.doesNotMatch(css,/img,picture,video,canvas/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/:focus-visible/);
});
test('both publishing and browser CI apply cleanup before the existing strict audit',()=>{
 const {sourceFiles,requiredFiles}=require('../scripts/prepare-site.cjs');
 assert.ok(sourceFiles.includes('text-first-site.css'));
 assert.ok(requiredFiles.includes('text-first-site.css'));
 for(const name of ['pages.yml','browser-qa.yml']){
  const workflow=read('.github/workflows/'+name);
  const apply=workflow.indexOf('node scripts/apply-text-mode.cjs _site');
  const audit=workflow.indexOf('node scripts/audit-site.cjs _site');
  assert.ok(apply>0&&audit>apply,name+' must audit the final text-only output');
 }
});