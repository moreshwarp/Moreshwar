const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const journal=read('index.html'),classic=read('classic.html'),archive=read('reading-archive.html');
test('journal remains compact and bookshelf contains 143 searchable entries',()=>{
 const data=JSON.parse(read('bookshelf.json'));assert.equal(data.books.length,143);
 for(const id of ['featured','shelf-toggle','shelf-search','shelf-list'])assert.ok(journal.includes('id="'+id+'"'),id);
 assert.match(journal,/bookshelf\.json/);
 assert.ok(!journal.includes('id="systems-lab"'),'legacy workspace must stay separate');
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
 for(const asset of ['unified-site.css','classic.html','bookshelf.json','reading-archive.html'])assert.ok(workflow.includes(asset),asset);
});
