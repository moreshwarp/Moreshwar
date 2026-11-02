const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('interactive observatory replaces static hero artwork with genuine controls',()=>{
 const html=read('index.html');
 assert.match(html,/class="obs-frame" data-observatory/);
 assert.match(html,/id="obs-detail" aria-live="polite"/);
 assert.equal((html.match(/data-idea="/g)||[]).length,5);
 for(const id of ['systems','proof','books','ideas','research'])assert.match(html,new RegExp('data-idea="'+id+'"'));
 assert.match(html,/aria-pressed="true"/);
 assert.match(html,/aria-controls="obs-detail"/);
 for(const link of ['idea-observatory.css','idea-observatory.js'])assert.ok(html.includes(link));
 assert.doesNotMatch(html,/class="at-hero-art"/);
});
test('observatory destinations exist and support keyboard navigation without telemetry',()=>{
 const js=read('idea-observatory.js'),css=read('idea-observatory.css');
 for(const destination of ['classic.html#systems-lab','reading-archive.html','studio.html','index.html#bookshelf','articles/165015685-zero-knowledge-proof-zkp-the-magic-of-proving-without-revealing-9e41181e918e.html']){
  assert.ok(js.includes(destination),destination);
  const base=destination.split('#')[0];assert.ok(fs.existsSync(path.join(root,base)),base);
 }
 assert.match(js,/ArrowRight/);assert.match(js,/ArrowLeft/);
 assert.match(js,/textContent/);assert.match(js,/aria-pressed/);
 assert.doesNotMatch(js,/fetch\(|localStorage|sessionStorage|analytics|\.innerHTML/);
 assert.match(css,/@media\(max-width:420px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('GitHub Pages publishes observatory logic and styling from single manifest',()=>{
 const {sourceFiles,requiredFiles}=require('../scripts/prepare-site.cjs');
 for(const p of ['idea-observatory.css','idea-observatory.js']){
  assert.ok(sourceFiles.includes(p),p);
  assert.ok(requiredFiles.includes(p),p);
 }
});
