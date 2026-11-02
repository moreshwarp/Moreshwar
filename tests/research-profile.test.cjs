const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('resume-inspired research profile gives visitors a clear identity and information architecture',()=>{
 const home=read('index.html');
 assert.match(home,/id="hero-title">Hello, I'm/);
 for(const id of ['about-profile','research-projects','idea-map','essays','bookshelf','reading-desk'])assert.ok(home.includes('id="'+id+'"'),id);
 assert.match(home,/class="rs-section-nav"/);
 assert.match(home,/class="rs-hero-visual"/);
 assert.equal((home.match(/class="rs-project rs-project/g)||[]).length,1);
 assert.equal((home.match(/class="rs-project(?: rs-project-main)?"/g)||[]).length,3);
 assert.equal((home.match(/data-observatory/g)||[]).length,1);
 assert.ok(home.indexOf('id="research-projects"')<home.indexOf('id="idea-map"'));
 for(const dest of ['classic.html#systems-lab','classic.html#inquiry','reading-archive.html','studio.html'])assert.ok(home.includes('href="'+dest+'"'));
 assert.match(home,/not a claim of completed scientific breakthroughs/);
});
test('locally hosted, responsive new profile has meaningful visual design and no external runtime',()=>{
 const css=read('research-profile.css'),home=read('index.html'),site=require('../scripts/prepare-site.cjs');
 assert.ok(site.sourceFiles.includes('research-profile.css'));
 assert.ok(site.requiredFiles.includes('research-profile.css'));
 assert.match(home,/href="research-profile.css"/);
 assert.match(css,/@media\(max-width:510px\)/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/:focus|focus-visible|at-nav/);
 assert.doesNotMatch(css,/@import|https?:\/\//);
});
