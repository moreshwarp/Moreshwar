const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(base,name),'utf8');
const catalog=JSON.parse(read('data/science-cabinet.json'));
const html=read('index.html');
const client=read('science-ideas.js');
const docs=read('NOBEL_SOURCES.md');
test('2026 science Nobel awards link to verified awarding-institution reporting',()=>{
 const expected={
  Physics:'https://www.kva.se/en/news/the-nobel-prize-in-physics-2026/',
  Chemistry:'https://www.kva.se/en/news/the-nobel-prize-in-chemistry-2026/',
  'Physiology or Medicine':'https://news.ki.se/the-discovery-sheds-light-on-the-brains-mysteries-there-is-a-before-and-an-after'
 };
 assert.equal(catalog.nobel.length,3);
 assert.equal(catalog.reviewedOn,'2026-10-17');
 for(const item of catalog.nobel){
  assert.equal(item.awardUrl,expected[item.field]);
  assert.equal(item.verified,catalog.reviewedOn);
  assert.ok(item.educationUrl.startsWith('https://'));
  assert.ok(html.includes('href="'+item.awardUrl+'"'));
  assert.ok(docs.includes(item.awardUrl));
 }
 assert.equal((html.match(/Awarding institution source ↗/g)||[]).length,3);
 assert.equal((html.match(/class="nobel-sources"/g)||[]).length,3);
 assert.ok(client.includes('Awarding institution source ↗'));
 assert.ok(docs.includes('not** the Nobel Assembly'));
 assert.ok(!docs.includes('official NobelPrize.org 2026 press-release URLs were verified'));
});
