const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const journal=read('index.html'),classic=read('tests/fixtures/legacy-classic.html'),archive=read('reading-archive.html');
test('journal retains navigation and removes the public book shelf',()=>{
 for(const id of ['hero-title','academic-directory','research-projects'])assert.ok(journal.includes('id="'+id+'"'),id);
 assert.doesNotMatch(journal,/id="bookshelf"|id="reading-desk"|id="shelf-toggle"|bookshelf\.json/);
 assert.ok(!require('../scripts/prepare-site.cjs').sourceFiles.includes('bookshelf.json'));
});
test('archive preserves at least 22 real article files',()=>{
 const links=[...archive.matchAll(/articles\/[^"'?# ]+\.html/g)].map(m=>m[0]);
 assert.ok(new Set(links).size>=22,'Expected 22 unique article references');
 for(const link of new Set(links))assert.ok(fs.existsSync(path.join(root,link)),link);
});
test('classic research and contact remain accessible',()=>{
 for(const id of ['systems-lab','contact'])assert.ok(classic.includes('id="'+id+'"'),id);
});
test('journal links do not point to nonexistent fragments or files',()=>{
 for(const [,href] of journal.matchAll(/href="([^"]+)"/g)){
  if(href.startsWith('#'))assert.ok(journal.includes('id="'+href.slice(1)+'"'),href);
  else if(!/^[a-z]+:/i.test(href))assert.ok(fs.existsSync(path.join(root,href.split('#')[0])),href);
 }
});
test('Pages packages shared styles and classic workspace',()=>{
 const workflow=read('.github/workflows/pages.yml');
 assert.match(workflow,/node scripts\/prepare-site\.cjs _site/);
 const {sourceFiles}=require('../scripts/prepare-site.cjs');
 for(const asset of ['unified-site.css','reading-archive.html'])assert.ok(sourceFiles.includes(asset),asset);
});

test('secondary page links resolve to real destinations',()=>{
 assert.ok(archive.includes('href="studio.html#systems-lab"'));
 assert.ok(classic.includes('id="systems-lab"'));
 const confirmation=read('message-received.html');
 assert.ok(confirmation.includes('href="./reading-archive.html"'));
 assert.ok(confirmation.includes('href="./studio.html#contact"'));
 assert.ok(classic.includes('id="contact"'));
 assert.ok(journal.includes('href="studio.html"'),'Research studio must remain reachable');
});
test('published article navigation is fixed in build artifacts',()=>{
 const {decorate,articlePage}=require('../scripts/build-content.cjs');
 const files=fs.readdirSync(path.join(root,'articles')).filter(f=>f.endsWith('.html'));
 for(const file of files){
  const original=read('articles/'+file);
  const built=decorate(original,0);
  assert.doesNotMatch(built,/\bhref=["']\.\.\/#(?:home|writing|research|contact)["']/,
   'obsolete navigation in '+file);
 }
 const fresh=articlePage({meta:{title:'Test',date:'2026-10-25',description:'',category:'Systems'},body:'Sample'});
 assert.ok(fresh.includes('href="../index.html"'));
 assert.doesNotMatch(fresh,/href="\.\.\/index\.html#home"/);
});
