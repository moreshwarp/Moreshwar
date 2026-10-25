// Currently Reading: factual provenance, semantics, and deployment invariants.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('classic.html'),css=read('styles.css');

const feature=html.match(/<!-- BEGIN owner-curated-currently-reading -->([\s\S]*?)<!-- END owner-curated-currently-reading -->/)?.[1]||'';

test('one Currently Reading editorial feature lives within the library',()=>{
 assert.equal((html.match(/<!-- BEGIN owner-curated-currently-reading -->/g)||[]).length,1);
 assert.ok(html.indexOf('id="library"')<html.indexOf('class="current-reading"'));
 assert.ok(html.indexOf('class="current-reading"')<html.indexOf('id="book-grid"'));
 assert.match(feature,/<article class="current-reading" aria-labelledby="current-reading-title">/);
 assert.match(feature,/<h3 id="current-reading-title">The Almanack of Naval Ravikant<\/h3>/);
});
test('publisher-hosted real cover has useful alternative text and intrinsic size',()=>{
 assert.match(feature,/<img class="current-reading__cover"[^>]*src="https:\/\/d28hgpri8am2if\.cloudfront\.net\/book_images\/onix\/cvr9798893310948\/the-almanack-of-naval-ravikant-9798893310948_hr\.jpg"/);
 assert.match(feature,/<img class="current-reading__cover"[^>]*width="640" height="960"/);
 assert.match(feature,/<img class="current-reading__cover"[^>]*alt="Cover of The Almanack of Naval Ravikant: A Guide to Wealth and Happiness"/);
 assert.match(feature,/loading="lazy"/);
});
test('editorial credits and reading status are accurately distinguished from a review',()=>{
 for(const credit of ['Eric Jorgenson','Jack Butcher','Tim Ferriss'])assert.ok(feature.includes(credit),credit);
 assert.match(feature,/Reading in progress/);
 assert.match(feature,/not a completed review/);
 assert.match(feature,/what evidence might challenge them/);
});
test('outbound links are source-linked and open safely',()=>{
 assert.match(feature,/https:\/\/www\.navalmanack\.com\/home/);
 assert.match(feature,/https:\/\/www\.simonandschuster\.com\/books\/The-Almanack-of-Naval-Ravikant\/Eric-Jorgenson\/9798893310948/);
 const links=[...feature.matchAll(/<a\s[^>]*>/g)].map(x=>x[0]);
 assert.equal(links.length,3);
 for(const link of links){
  assert.match(link,/href="https:\/\//);
  assert.match(link,/target="_blank"/);
  assert.match(link,/rel="noopener noreferrer"/);
 }
});
test('responsive CSS supports phones, keyboard navigation and reduced motion',()=>{
 assert.match(css,/\.current-reading\{display:grid/);
 assert.match(css,/@media\(max-width:700px\)\{\.current-reading\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/@media\(max-width:360px\)/);
 assert.match(css,/\.current-reading__links a:focus-visible/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.current-reading__visual>a/);
});
test('GitHub Pages artifact and PR quality workflow preserve the feature',()=>{
 const deploy=read('.github/workflows/pages.yml');
 const browser=read('.github/workflows/browser-qa.yml');
 const quality=read('.github/workflows/quality.yml');
 assert.match(deploy,/cp index\.html styles\.css/);
 assert.match(quality,/pull_request:/);
 assert.match(browser,/pull_request:/);
 assert.match(browser,/node tests\/browser\.cjs/);
});
