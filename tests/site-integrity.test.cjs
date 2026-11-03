const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {finalizeHtml}=require('../scripts/finalize-site.cjs'),{check,references}=require('../scripts/audit-site.cjs');
test('article finalizer restores scholarly navigation and corrects historic stale links without losing content',()=>{
 const article='<!doctype html><html><head><title>Research note</title></head><body><main><h1>Original essay</h1><a href="../#writing">Writing</a><a href="../index.html#systems-lab">Lab</a></main></body></html>';
 const final=finalizeHtml(article);assert.match(final,/article-unified\.css/);assert.match(final,/article-unified\.js/);
 assert.match(final,/class="sch-reader"/);assert.match(final,/href="\.\.\/reading-archive\.html"/);assert.match(final,/href="\.\.\/studio\.html#systems-lab"/);
 assert.match(final,/Original essay/);
 assert.equal(finalizeHtml(final),final,'finalization must be idempotent');
});
test('local link auditor checks every relative asset and HTML fragment',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mrl-site-'));try{
  fs.mkdirSync(path.join(dir,'articles'));fs.writeFileSync(path.join(dir,'index.html'),'<html><body><h1 id="reading">Reading</h1><a href="articles/test.html#section">Go</a><script src="site.js"></script></body></html>');
  fs.writeFileSync(path.join(dir,'articles','test.html'),'<html><body><h2 id="section">Section</h2><a href="../index.html#reading">Home</a></body></html>');
  fs.writeFileSync(path.join(dir,'site.js'),'/*test*/');
  assert.equal(check(dir).pages,2);
  fs.writeFileSync(path.join(dir,'articles','test.html'),'<html><body><a href="../index.html#missing">Bad anchor</a></body></html>');
  assert.throws(()=>check(dir),/missing anchor/);
  fs.writeFileSync(path.join(dir,'articles','test.html'),'<html><body><a href="../unavailable.css">Missing</a></body></html>');
  assert.throws(()=>check(dir),/missing local/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('all 25 source articles are included in strict audit and shared design manifest',()=>{
 const root=path.resolve(__dirname,'..');const source=fs.readdirSync(path.join(root,'articles')).filter(n=>n.endsWith('.html'));
 assert.ok(source.length>=25,'unexpected loss of published or working articles');
 const manifest=require('../scripts/prepare-site.cjs');
 for(const f of ['article-unified.css','article-unified.js']){assert.ok(manifest.sourceFiles.includes(f));assert.ok(manifest.requiredFiles.includes(f))}
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/pages.yml'),'utf8');
 assert.match(workflow,/node scripts\/finalize-site\.cjs _site/);assert.match(workflow,/node scripts\/audit-site\.cjs _site/);
 for(const yaml of ['quality.yml','browser-qa.yml'])assert.match(fs.readFileSync(path.join(root,'.github/workflows',yaml),'utf8'),/node scripts\/audit-site\.cjs _site/);
});
