const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(base,'data/science-cabinet.json'),'utf8'));
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const client=fs.readFileSync(path.join(base,'science-ideas.js'),'utf8');
test('2026 science Nobel prize links point to the Nobel committees official announcements',()=>{
 const expected={Physics:'physics',Chemistry:'chemistry','Physiology or Medicine':'medicine'};
 assert.equal(catalog.nobel.length,3);
 for(const item of catalog.nobel){
  assert.equal(item.awardUrl,'https://www.nobelprize.org/prizes/'+expected[item.field]+'/2026/press-release/');
  assert.ok(item.educationUrl.startsWith('https://'));
  assert.ok(html.includes('href="'+item.awardUrl+'"'));
 }
 assert.equal((html.match(/Official Nobel announcement/g)||[]).length,3);
 assert.equal((html.match(/class="nobel-sources"/g)||[]).length,3);
 assert.ok(client.includes('Official Nobel announcement'));
});
