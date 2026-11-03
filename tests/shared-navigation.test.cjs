const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('one shared academic header is installed on every primary public page',()=>{
 for(const page of ['index.html','reading-archive.html','studio.html']){
  const source=read(page);
  for(const asset of ['shared-navigation.css','shared-navigation.js'])assert.match(source,new RegExp('(?:href|src)="'+asset.replace('.','\\.')+'"'),page+' missing '+asset);
 }
 const {sourceFiles,requiredFiles}=require('../scripts/prepare-site.cjs');
 for(const asset of ['shared-navigation.css','shared-navigation.js']){assert.ok(sourceFiles.includes(asset));assert.ok(requiredFiles.includes(asset))}
});
test('navigation has real academic destinations, accessible details, mobile menu and search',()=>{
 const js=read('shared-navigation.js'),css=read('shared-navigation.css');
 for(const p of ['studio.html#systems-lab','studio.html#inquiry','studio.html#science-ideas','index.html#academic-recent','studio.html#contact','index.html#bookshelf','index.html#about','reading-archive.html','studio.html'])assert.ok(js.includes(p),p);
 for(const p of ['Research','Writing','Reading','About'])assert.ok(js.includes("label:'"+p+"'"),p);
 assert.match(js,/<details class="mrl-nav-group"/);
 assert.match(js,/aria-expanded/);
 assert.match(js,/event\.key==='Escape'/);
 assert.match(js,/\.mrl-site-search/);
 assert.match(js,/closeGroups/);
 assert.match(css,/@media\(max-width:940px\)/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('studio no longer displays internal design-review notice',()=>{
 assert.doesNotMatch(read('studio.html'),/DESIGN REVIEW · OPTION 3/);
});
