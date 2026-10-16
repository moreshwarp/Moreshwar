/* The Inquiry Engine must reason with explicit assumptions and disclose limitations. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const {fanOutRisk,protocols}=require('../inquiry.js');
const h=read('index.html'),css=read('inquiry.css'),method=read('RESEARCH_METHOD.md');
test('exact independent fan-out probability matches known example',()=>{
 assert.ok(Math.abs(fanOutRisk(8,.05)-.33657956871093775)<1e-12);
 assert.ok(Math.abs(fanOutRisk(1,.05)-.05)<1e-12);
 assert.equal(fanOutRisk(1,0),0);
 assert.equal(fanOutRisk(10,1),1);
});
test('higher fan-out or failure rate cannot reduce risk under the stated model',()=>{
 for(const p of [.01,.05,.1,.2]){
  let prior=0;
  for(const n of [1,2,3,4,8,16,32]){
   const current=fanOutRisk(n,p);
   assert.ok(current>=prior&&current<=1);
   prior=current;
  }
 }
 for(const n of [1,4,12]){
  assert.ok(fanOutRisk(n,.1)>fanOutRisk(n,.01));
 }
});
test('invalid input is rejected instead of producing misleading numbers',()=>{
 for(const [n,p] of [[0,.05],[-1,.05],[1,-.2],[1,1.01],[1,NaN],[2.2,.2],['bad',.05]]){
  assert.throws(()=>fanOutRisk(n,p),RangeError);
 }
});
test('all four visible questions have hypotheses, falsifiers and next steps',()=>{
 assert.equal(Object.keys(protocols).length,4);
 for(const id of ['latency','consistency','learning','frontend']){
  const x=protocols[id];
  assert.ok(x.title.length>15&&x.hypothesis.length>30&&x.falsifier.length>30&&x.next.length>30);
  assert.match(h,new RegExp('data-inquiry="'+id+'"'));
  assert.ok(x.link.startsWith('articles/')||x.link.startsWith('https://')||x.link.startsWith('#'));
 }
});
test('educational claims are explicitly not published experimental results',()=>{
 assert.match(h,/SIMULATED \/ NOT MEASURED/);
 assert.match(h,/independent requests/);
 assert.match(h,/this is not measured service telemetry/);
 assert.match(method,/not.*application.s p99/i);
 assert.match(method,/No such experiment is claimed/);
 assert.doesNotMatch(h,/we tested \d+|production data confirms/i);
});
test('dynamic controls are accessible with live result announcement',()=>{
 assert.match(h,/id="inquiry-services" type="range"/);
 assert.match(h,/id="inquiry-slow-rate" type="range"/);
 assert.match(h,/id="inquiry-risk" aria-live="polite"/);
 assert.match(h,/id="inquiry-simulator"/);
 assert.match(h,/role="group"/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('site includes a navigable inquiry section and linked method documentation',()=>{
 assert.match(h,/id="inquiry" aria-labelledby="inquiry-title"/);
 assert.equal((h.match(/href="#inquiry"/g)||[]).length,2);
 assert.match(h,/RESEARCH_METHOD\.md/);
 const workflow=read('.github/workflows/pages.yml');
 const browser=read('.github/workflows/browser-qa.yml');
 for(const f of ['inquiry.css','inquiry.js']){
  assert.ok(workflow.includes(f));
  assert.ok(browser.includes(f));
 }
});
