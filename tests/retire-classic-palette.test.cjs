const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const {sourceFiles,requiredFiles}=require('../scripts/prepare-site.cjs');
test('retired classic route is not shipped; original remains an unserved historical fixture',()=>{
 assert.equal(fs.existsSync(path.join(root,'classic.html')),false);
 assert.equal(sourceFiles.includes('classic.html'),false);
 assert.equal(requiredFiles.includes('classic.html'),false);
 assert.ok(fs.statSync(path.join(root,'tests/fixtures/legacy-classic.html')).size>100000);
 for(const p of ['index.html','studio.html','reading-archive.html','message-received.html','shared-navigation.js','heritage-unified.js','idea-observatory.js','scripts/build-content.cjs','scripts/finalize-site.cjs']){
  assert.doesNotMatch(read(p),/classic\.html/i,p+' links to removed page');
 }
});
test('research, science, inquiry and contact live inside the maintained Studio',()=>{
 const studio=read('studio.html');
 for(const id of ['systems-lab','inquiry','science-ideas','contact']){
  assert.ok(studio.includes('id="'+id+'"'),'missing '+id);
  assert.ok(read('index.html').includes('studio.html#'+id)||id==='contact'&&read('index.html').includes('studio.html#contact'),'research destination missing '+id);
 }
 assert.ok(studio.includes('articles/fieldnote-queues.html'));
 assert.ok(studio.includes('mailto:moreshwarpidadi@gmail.com'));
});
test('one canonical palette sets paired surfaces, ink, link, control and focus colors',()=>{
 const css=read('text-first-site.css');
 for(const token of ['--site-paper','#ffffff','--site-surface','#ffffff','--site-ink','#171717','--site-link','#965262','--site-button','#171717','--site-button-text','#ffffff','--site-focus','#965262','--site-muted','#d1d1d1']){
  assert.ok(css.includes(token),token);
 }
 assert.match(css,/html\[data-theme="dark"\]/);
 assert.match(css,/body\.mrl-text-first\.mrl-nav-ready \.mrl-site-header/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});