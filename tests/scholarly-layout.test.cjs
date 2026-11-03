const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('two-column scholarly homepage has genuine research material in main and side regions',()=>{
 const html=read('index.html');
 assert.match(html,/mrl-scholarly/);
 assert.match(html,/class="academic-main"/);
 assert.match(html,/class="academic-sidebar" aria-label="Research profile and selected references"/);
 assert.match(html,/id="academic-directory"/);
 assert.match(html,/class="academic-portrait"/);
 assert.match(html,/assets\/distributed-request-flow\.svg/);
 assert.match(html,/id="hero-title"/);
 assert.equal((html.match(/id="academic-directory"/g)||[]).length,1);
 assert.equal((html.match(/class="academic-sidebar"/g)||[]).length,1);
 assert.ok(html.indexOf('class="academic-directory"')<html.indexOf('class="academic-sidebar"'));
 for(const item of ['Recent essays','Selected writing','Books and references','Source and reproducibility'])assert.ok(html.includes(item));
 assert.doesNotMatch(html,/kleppmann-local-first-2026.jpg|Martin Kleppmann is an Associate Professor/);
});
test('scholarly responsive layout ships locally, not from reference website',()=>{
 const css=read('scholarly-layout.css'),html=read('index.html'),site=require('../scripts/prepare-site.cjs');
 assert.ok(site.sourceFiles.includes('scholarly-layout.css'));
 assert.ok(site.requiredFiles.includes('scholarly-layout.css'));
 assert.match(html,/href="scholarly-layout.css"/);
 assert.match(css,/grid-template-columns:minmax\(0,590px\) minmax\(0,330px\)/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/@import|https?:\/\//);
});
