const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const data=JSON.parse(read('data/science-cabinet.json'));
const html=read('index.html');
const script=read('science-ideas.js');
const css=read('science-ideas.css');

test('English science listening collection has diverse grounded sources',()=>{
 assert.equal(data.language,'English');
 assert.equal(data.podcasts.length,8);
 assert.ok(data.podcasts.some(x=>x.region==='India'&&x.id==='iisc'));
 assert.ok(data.podcasts.some(x=>x.id==='deepmind'));
 assert.ok(data.podcasts.some(x=>x.id==='lex'));
 assert.ok(data.podcasts.some(x=>x.id==='quanta'));
 assert.ok(data.podcasts.some(x=>x.id==='purescience'&&/video/i.test(x.origin)));
 for(const p of data.podcasts){assert.match(p.url,/^https:\/\//);assert.ok(p.question.length>15)}
});
test('8 source-linked thought prompts are explicitly paraphrases not fabricated quotes',()=>{
 assert.equal(data.thoughts.length,8);
 assert.match(html,/not verbatim quotations/);
 assert.match(html,/id="idea-next"/);
 assert.match(script,/getUTCFullYear/);
 assert.match(script,/dayKey/);
 assert.match(script,/manualOffset/);
 for(const t of data.thoughts){assert.match(t.url,/^https:\/\//);assert.ok(t.idea&&t.prompt&&t.person)}
});
test('science Nobel 2026 summaries are sourced and separate biography attribution',()=>{
 assert.equal(data.nobel.length,3);
 assert.deepEqual(data.nobel.map(x=>x.field),['Physics','Chemistry','Physiology or Medicine']);
 assert.ok(data.nobel.every(x=>x.year===2026&&x.verified===data.reviewedOn));
 assert.ok(data.nobel.every(x=>x.education.length>40&&x.story.length>70&&x.lesson.length>35));
 assert.ok(data.nobel.every(x=>x.awardUrl.startsWith('https://')&&x.educationUrl.startsWith('https://')));
 assert.match(data.nobel[1].education,/about Soai, not Kagan/);
 assert.match(data.nobel[2].education,/about Deisseroth, not his co-laureates/);
});
test('science cards remain readable without external script or JSON',()=>{
 assert.equal((html.match(/class="science-pod" data-region=/g)||[]).length,8);
 assert.equal((html.match(/class="nobel-portrait"/g)||[]).length,3);
 assert.match(html,/id="idea-text"/);
 assert.match(html,/id="science-load-status"/);
 assert.match(html,/id="science-ideas"/);
 assert.match(html,/science-ideas\.css/);
 assert.match(html,/science-ideas\.js/);
});
test('no hard-coded innerHTML is used with external catalogue text',()=>{
 assert.match(script,/textContent/);
 assert.doesNotMatch(script,/\.innerHTML\s*=/);
 assert.match(script,/replaceChildren/);
 assert.match(script,/aria-pressed/);
 assert.match(script,/https:/);
});
test('Pages artifact contains science data and scripts',()=>{
 for(const workflow of ['.github/workflows/pages.yml','.github/workflows/browser-qa.yml']){
  const source=read(workflow);
  for(const file of ['science-ideas.js','science-ideas.css','data/science-cabinet.json'])assert.ok(source.includes(file),workflow+' missing '+file);
 }
});
test('layout and accessibility support phone screens and reduced motion',()=>{
 assert.match(css,/@media\(max-width:540px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(html,/role="group" aria-label="Filter English listening leads by region"/);
 assert.match(html,/aria-live="polite"/);
});
