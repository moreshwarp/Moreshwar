const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('atlas experience retains the public journal and accessible research navigation',()=>{
 const home=read('index.html');
 for(const id of ['main-content','hero-title','essays','reading-desk','about','bookshelf','field-guide'])assert.ok(home.includes('id="'+id+'"'),id);
 for(const href of ['classic.html#systems-lab','classic.html#inquiry','reading-archive.html','studio.html'])assert.ok(home.includes('href="'+href+'"'),href);
 assert.match(home,/aria-labelledby="field-guide-title"/);
 assert.match(home,/educational models, not production benchmarks/);
 assert.match(home,/mrl-atlas/);
});
test('atlas style is deployed and used on all primary reading routes',()=>{
 const css=read('atlas-edition.css');
 const {sourceFiles,requiredFiles}=require('../scripts/prepare-site.cjs');
 assert.ok(sourceFiles.includes('atlas-edition.css'));
 assert.ok(requiredFiles.includes('atlas-edition.css'));
 for(const p of ['index.html','reading-archive.html','studio.html'])assert.match(read(p),/href="atlas-edition\.css"/);
 assert.match(css,/@media\(max-width:540px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/:focus-visible/);
 assert.doesNotMatch(css,/https?:\/\//,'Stylesheet should not load external UI assets');
});
