const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('academic homepage prioritizes verified original writing and real research, without fabricated credentials',()=>{
 const html=read('index.html');
 for(const marker of ['id="academic-directory"','id="academic-recent"','Recent essays','Selected writing','Research and experiments'])assert.ok(html.includes(marker),marker);
 assert.equal((html.match(/<time datetime="20/g)||[]).length,5);
 for(const route of ['articles/183772820-the-secret-link-between-sounding.html','articles/182482423-the-lie-we-tell-ourselves-why-good.html','articles/165015685-zero-knowledge-proof-zkp-the-magic-of-proving-without-revealing-9e41181e918e.html','studio.html#systems-lab','reading-archive.html'])assert.ok(html.includes(route),route);
 assert.match(html,/not peer-reviewed|not presented as peer-reviewed/);
 assert.doesNotMatch(html,/Associate Professor at|peer-reviewed publications by Moreshwar|invited keynote speaker/i);
});
test('academic style is actually served on all main pages and does not depend on remote source code',()=>{
 const css=read('academic-journal.css');
 const {sourceFiles,requiredFiles}=require('../scripts/prepare-site.cjs');
 assert.ok(sourceFiles.includes('academic-journal.css'));
 assert.ok(requiredFiles.includes('academic-journal.css'));
 for(const p of ['index.html','reading-archive.html','studio.html']){
  assert.match(read(p),/href="academic-journal\.css"/,p);
  assert.match(read(p),/mrl-academic/,p);
 }
 assert.match(css,/Georgia/);
 assert.match(css,/@media\(max-width:510px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/@import|https?:\/\//);
});
