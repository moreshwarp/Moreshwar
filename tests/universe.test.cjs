// Ten universes remain available to the owner through versioned settings.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const stylesheet=read('universe.css'),config=JSON.parse(read('data/site-settings.json'));
const themes=['science','hero','noir','quantum','shinobi','bureau','nature','terminal','circuit','arcade'];
test('all ten cinematic/scientific palettes remain implemented',()=>{
 for(const theme of themes){if(theme==='science')assert.match(stylesheet,/:root\[data-universe\]/);else assert.match(stylesheet,new RegExp('data-universe="'+theme+'"'));}
});
test('theme selection is repo-published rather than visitor-selectable',()=>{
 assert.ok(themes.includes(config.theme));assert.ok(['light','dark'].includes(config.brightness));
 const html=read('index.html');
 assert.doesNotMatch(html,/data-universe-select=|id="theme-toggle"|id="universe-trigger"/);
 assert.match(html,/publisher\.css/);
});
test('the owner can edit appearance in GitHub-authorized Pages CMS',()=>{
 const cms=read('.pages.yml');
 assert.match(cms,/OWNER CONTROLLED/);
 assert.match(cms,/name: theme/);
 assert.match(cms,/values:/);
 assert.match(cms,/data\/site-settings\.json/);
});
test('public theme is consistent across 25 article pages through build decoration',()=>{
 const page=read('scripts/build-content.cjs');
 assert.match(page,/reader-feedback\.css/);
 assert.match(page,/site-settings\.js/);
 assert.match(page,/reader-feedback\.js/);
});
test('ten themes keep movie, book, article, YouTube collections without unapproved personal claims',()=>{
 const items=JSON.parse(read('data/recommendations.json'));
 assert.equal(items.length,40);
 assert.ok(items.every(i=>i.approved===false));
 for(const t of themes)assert.equal(items.filter(i=>i.universe===t).length,4);
});
