// Owner-controlled CMS, publishing, and discussion regression tests.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const engine=require('../scripts/build-content.cjs');
const source=read('index.html'),settings=JSON.parse(read('data/site-settings.json'));
const picks=JSON.parse(read('data/recommendations.json'));
test('one canonical public appearance is authored by repository owner',()=>{
 assert.deepEqual(engine.settingsOK(settings),settings);
 assert.match(source,/<script src="site-settings\.js"><\/script>/);
 assert.doesNotMatch(source,/id="theme-toggle"|id="universe-trigger"|id="theme-studio"|data-universe-select=/);
 assert.doesNotMatch(source,/moreshwar-theme-v1|moreshwar-universe-v1/);
 assert.doesNotMatch(source,/id="admin-dialog"|id="admin-entry"/);
 assert.doesNotMatch(read('app.js'),/admin-entry|admin-login|renderAdminEntries|initBackend\(\);/);
});
test('the CMS is a separate GitHub-authenticated authoring workflow, never public-page auth theater',()=>{
 const cms=read('.pages.yml');
 assert.match(cms,/type: rich-text/);
 assert.match(cms,/content\/posts/);
 assert.match(cms,/data\/site-settings\.json/);
 assert.match(cms,/data\/recommendations\.json/);
 assert.match(cms,/published/);
 assert.match(read('.github/workflows/pages.yml'),/scripts\/build-content\.cjs/);
});
test('draft status and structured metadata are parsed without implicit publication',()=>{
 const input='---\ntitle: "Draft: why systems fail"\ndate: 2026-10-15\npublished: false\ncategory: Systems\n---\n# Title\n\nSome draft text.';
 const {meta,body}=engine.parseFrontMatter(input);
 assert.equal(meta.title,'Draft: why systems fail');
 assert.equal(meta.published,false);
 assert.match(body,/Some draft text/);
 assert.equal(engine.parseFrontMatter('No frontmatter').meta.published,undefined);
});
test('safe Markdown renderer escapes HTML and hostile links',()=>{
 const html=engine.markdown('# Model\n\n**safe** [documentation](https://example.com) <img src=x onerror=alert(1)> \n\n[evil](javascript:alert(1))');
 assert.match(html,/<h1>Model<\/h1>/);
 assert.match(html,/&lt;img/);
 assert.doesNotMatch(html,/<img src=x|href="javascript:/);
 assert.match(html,/<strong>safe<\/strong>/);
 assert.match(html,/rel="noopener noreferrer"/);
});
test('only http and https links or same-site image resources are emitted',()=>{
 assert.equal(engine.allowedUrl('javascript:alert(1)'),null);
 assert.equal(engine.allowedUrl('data:text/html,hello'),null);
 assert.equal(engine.allowedUrl('https://moreshwarp.github.io/other/'),null);
 assert.equal(engine.allowedUrl('/Moreshwar/assets/editorial/image.png'),'https://moreshwarp.github.io/Moreshwar/assets/editorial/image.png');
});
test('all original article URLs have their own mapped reaction/comment discussion',()=>{
 const map=JSON.parse(read('data/reader-threads.json'));
 assert.equal(Object.keys(map).length,25);
 for(const x of Object.values(map))assert.ok(Number.isSafeInteger(x)&&x>0);
 assert.equal(new Set(Object.values(map)).size,25);
});
test('comments are rendered as text instead of arbitrary markup',()=>{
 const script=read('reader-feedback.js');
 assert.match(script,/body\.textContent/);
 assert.doesNotMatch(script,/innerHTML/);
 assert.doesNotMatch(script,/localStorage/);
 assert.match(script,/https:\/\/api\.github\.com\/repos/);
});
test('recommended items are organized into ten visual themes and four types',()=>{
 assert.equal(picks.length,40);
 const universe=['science','hero','noir','quantum','shinobi','bureau','nature','terminal','circuit','arcade'];
 for(const theme of universe){
  const matches=picks.filter(x=>x.universe===theme);
  assert.deepEqual(matches.map(x=>x.kind).sort(),['Article','Book','Movie','YouTube']);
  for(const m of matches){assert.equal(m.approved,false);assert.ok(engine.allowedUrl(m.url))}
 }
});
test('HTML decoration adds visible discussion and removes visitor-selected theme state',()=>{
 const original='<html><head><script defer src="../theme.js?v=old"></script></head><body><main><p>Real article</p></main></body></html>';
 const output=engine.decorate(original,8);
 assert.match(output,/data-reader-feedback data-issue="8"/);
 assert.match(output,/reader-feedback\.js/);
 assert.match(output,/site-settings\.js/);
 assert.doesNotMatch(output,/src="\.\.\/theme\.js/);
});
test('the publishing build preserves 25 legacy articles and excludes draft Markdown',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'moreshwar-publish-test-'));
 try {
  fs.copyFileSync(path.join(root,'index.html'),path.join(directory,'index.html'));
  fs.cpSync(path.join(root,'articles'),path.join(directory,'articles'),{recursive:true});
  const result=engine.build(directory);
  assert.equal(result.legacy,25);
  assert.equal(result.published.length,0);
  const html=fs.readFileSync(path.join(directory,'index.html'),'utf8');
  assert.match(html,/An intellectual field guide\./);
  assert.match(html,/The Imitation Game/);
  assert.doesNotMatch(html,/<!--THEME_PICKS-->/);
  assert.equal((html.match(/<li><a href="articles\//g)||[]).length,22);
  assert.ok(!fs.existsSync(path.join(directory,'articles','notes-example-draft.html')));
  const issue=fs.readFileSync(path.join(directory,'articles','fieldnote-queues.html'),'utf8');
  assert.match(issue,/data-issue="29"/);
  assert.doesNotMatch(issue,/moreshwar-theme-v1/);
  const config=fs.readFileSync(path.join(directory,'site-settings.js'),'utf8');
  assert.match(config,/data/);
  assert.doesNotMatch(config,/localStorage/);
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});

// Raw repository HTML must remain readable even if GitHub Pages accidentally serves the main branch.
test('unprocessed source has no empty Curiosity Index placeholders',()=>{
  const index=read('index.html');
  for(const text of ['An intellectual field guide.','The Imitation Game','Designing Data-Intensive Applications','MIT Distributed Systems Lectures','The research thread'.toUpperCase()]){
    assert.ok(index.toUpperCase().includes(text.toUpperCase()),'Missing fallback '+text);
  }
  assert.doesNotMatch(index,/<!--PICK_HEADING-->|<!--PICK_INTRO-->|<!--THEME_PICKS-->|<!--CURRENT_UNIVERSE-->/);
});
test('publishing build still has paired replacement anchors',()=>{
  const index=read('index.html');
  for(const key of ['PICK_HEADING','PICK_INTRO','THEME_PICKS','CURRENT_UNIVERSE','PUBLISHED_POSTS']){
    assert.ok(index.includes('<!--'+key+'_BEGIN-->'));
    assert.ok(index.includes('<!--'+key+'_END-->'));
  }
});
