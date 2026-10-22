const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {prepare}=require('../scripts/prepare-site.cjs');
test('QA and deployment share a complete public fixture',()=>{
 const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(root,'fixture-test-'));
 try{
  prepare(out);
  for(const page of ['index.html','studio.html','reading-archive.html']){
   const html=fs.readFileSync(path.join(out,page),'utf8');
   for(const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
    const url=new URL(match[1],'https://fixture.invalid/'+page);
    if(url.origin!=='https://fixture.invalid')continue;
    const target=path.join(out,decodeURIComponent(url.pathname));
    assert.ok(fs.existsSync(target),'Missing '+match[1]+' referenced by '+page);
    if(url.hash)assert.ok(fs.readFileSync(target,'utf8').includes('id="'+url.hash.slice(1)+'"'),'Missing fragment '+match[1]);
   }
  }
  assert.ok(fs.existsSync(path.join(out,'bookshelf.json')));
  for(const name of ['pages.yml','browser-qa.yml'])assert.match(fs.readFileSync(path.join(root,'.github/workflows',name),'utf8'),/node scripts\/prepare-site.cjs _site/);
 }finally{fs.rmSync(out,{recursive:true,force:true})}
});
