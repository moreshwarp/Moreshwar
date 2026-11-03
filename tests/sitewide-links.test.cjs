const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {inject,finalize}=require('../scripts/finalize-site.cjs'),{scan}=require('../scripts/audit-site.cjs');
test('all public HTML receives a unified style without changing article prose',()=>{
 const sample='<!doctype html><html><head><title>Essay</title></head><body><main id="chapter"><p>Original research text.</p></main></body></html>';
 const article=inject(sample,'articles/example.html');
 assert.match(article,/href="\.\.\/text-first-site\.css"/);
 assert.match(article,/src="\.\.\/shared-navigation\.js"/);
 assert.match(article,/mrl-article-page/);
 assert.match(article,/Original research text/);
 assert.match(inject(sample,'index.html'),/href="text-first-site\.css"/);
});
test('link audit finds broken files and anchors and accepts valid documents',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mrl-links-'));
 try{
  fs.mkdirSync(path.join(temp,'articles'));
  fs.writeFileSync(path.join(temp,'index.html'),'<html><head></head><body><a href="articles/note.html#section">Note</a><a href="#home">Home</a><main id="home"></main></body></html>');
  fs.writeFileSync(path.join(temp,'articles/note.html'),'<html><head></head><body><h1 id="section">Note</h1><a href="../index.html#home">Back</a></body></html>');
  assert.equal(scan(temp).issues.length,0);
  fs.appendFileSync(path.join(temp,'index.html'),'<a href="missing-page.html">Broken</a><a href="articles/note.html#wrong">Missing section</a>');
  const kinds=scan(temp).issues.map(i=>i.kind);
  assert.ok(kinds.includes('missing-file'));assert.ok(kinds.includes('missing-anchor'));
  const count=finalize(temp);
  assert.equal(count,2);
  assert.match(fs.readFileSync(path.join(temp,'articles/note.html'),'utf8'),/mrl-article-page/);
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});
test('published asset manifest and CI enforce sitewide text-first reader and strict checks',()=>{
 const root=path.resolve(__dirname,'..');
 const script=fs.readFileSync(path.join(root,'scripts/prepare-site.cjs'),'utf8');
 const css=fs.readFileSync(path.join(root,'text-first-site.css'),'utf8');
 assert.match(script,/text-first-site\.css/);
 assert.match(css,/mrl-article-page/);
 assert.match(css,/mrl-text-first/);
 for(const workflow of ['pages.yml','browser-qa.yml']){
  const text=fs.readFileSync(path.join(root,'.github/workflows',workflow),'utf8');
  assert.match(text,/scripts\/finalize-site\.cjs _site/);
  assert.match(text,/scripts\/audit-site\.cjs _site --strict/);
 }
});