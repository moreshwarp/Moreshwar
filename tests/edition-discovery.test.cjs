const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('magazine discovery has functional accessible filters and five valid destinations',()=>{
 const home=read('index.html');
 assert.match(home,/id="editorial-discovery" aria-labelledby="ed-title"/);
 assert.match(home,/id="ed-status"[^>]+role="status" aria-live="polite"/);
 for(const topic of ['all','systems','thinking'])assert.match(home,new RegExp('data-ed-filter="'+topic+'"'));
 assert.equal((home.match(/class="ed-card ed-card--/g)||[]).length,5);
 assert.match(home,/id="ed-surprise"/);
 for(const match of home.matchAll(/class="ed-card ed-card--[^"]+" href="([^"]+)"/g)){
  const pathname=match[1].split('#')[0];assert.ok(fs.existsSync(path.join(root,pathname)),pathname);
 }
});
test('Open Props has an actual locally hosted open-source implementation and license',()=>{
 const css=read('edition.css'),script=read('edition.js'),builder=require('../scripts/prepare-site.cjs');
 for(const asset of ['edition.css','edition.js']){assert.ok(builder.sourceFiles.includes(asset));assert.ok(builder.requiredFiles.includes(asset));}
 assert.match(read('vendor/open-props/LICENSE'),/MIT License/);
 for(const file of ['colors.css','easing.css','sizes.css'])assert.ok(read('vendor/open-props/'+file).length>500);
 assert.match(builder.prepareSite.toString(),/'vendor'/);
 assert.match(css,/vendor\/open-props\/colors\.css/);
 assert.match(css,/var\(--ease-3\)/);
 assert.match(script,/aria-pressed/);assert.match(script,/\.hidden/);
 assert.doesNotMatch(script,/fetch\(|localStorage|sessionStorage|analytics/);
 assert.match(css,/@media\(max-width:530px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
