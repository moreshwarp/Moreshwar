'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const {sourceFiles,requiredFiles,prepareSite}=require('../scripts/prepare-site.cjs');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('one file manifest serves browser QA and the production publisher',()=>{
 const pages=read('.github/workflows/pages.yml');
 const browser=read('.github/workflows/browser-qa.yml');
 assert.match(pages,/node scripts\/prepare-site\.cjs _site/);
 assert.match(browser,/node scripts\/prepare-site\.cjs _site/);
 for(const filename of ['index.html','reading-archive.html','studio.html',
    'bookshelf.json','favicon.svg','social-preview.png','research-method.svg',
    'mrl-reboot.css','atelier.css','mobile-first.css','mobile-first.js']){
  assert.ok(sourceFiles.includes(filename),'shared manifest missing '+filename);
 }
 assert.equal(sourceFiles.length,new Set(sourceFiles).size,'duplicate published filenames');
 for(const filename of requiredFiles)assert.ok(sourceFiles.includes(filename),'required file not copied '+filename);
});

test('production deploys from main only after both independent test workflows',()=>{
 const pages=read('.github/workflows/pages.yml');
 const quality=read('.github/workflows/quality.yml');
 const browser=read('.github/workflows/browser-qa.yml');
 assert.match(pages,/push:\s*\n\s*branches: \[main\]/);
 assert.match(pages,/workflow_dispatch:/);
 assert.match(pages,/uses: \.\/\.github\/workflows\/quality\.yml/);
 assert.match(pages,/uses: \.\/\.github\/workflows\/browser-qa\.yml/);
 assert.match(pages,/needs: \[quality, browser\]/);
 assert.match(pages,/github\.ref == 'refs\/heads\/main'/);
 assert.match(pages,/pages: write/);
 assert.match(pages,/id-token: write/);
 assert.match(pages,/actions\/deploy-pages@v4/);
 for(const [name,source] of [['quality',quality],['browser',browser]]){
  assert.match(source,/workflow_call:/,name+' is not reusable');
  assert.match(source,/pull_request:/,name+' must still protect pull requests');
  assert.doesNotMatch(source,/^  push:/m,name+' repeats the same jobs on main');
 }
});

test('shared build publishes real social artwork, navigation and article data',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mrl-pages-test-'));
 try{
  prepareSite(dir);
  for(const asset of ['index.html','bookshelf.json','favicon.svg','social-preview.png',
    'research-method.svg','mrl-reboot.css','atelier.css','mobile-first.css',
    'mobile-first.js','reading-archive.html','studio.html',
    'data/science-cabinet.json']){
   assert.ok(fs.statSync(path.join(dir,asset)).size>0,'missing '+asset);
  }
  assert.ok(fs.statSync(path.join(dir,'articles')).isDirectory());
  assert.ok(fs.statSync(path.join(dir,'assets')).isDirectory());
  assert.ok(fs.existsSync(path.join(dir,'.nojekyll')));
  const png=fs.readFileSync(path.join(dir,'social-preview.png'));
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),1200);
  assert.equal(png.readUInt32BE(20),630);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
