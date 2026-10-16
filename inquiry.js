/* The Inquiry Engine is educational and intentionally claims no measured results. */
(function(root){
'use strict';
function fanOutRisk(n,p){
 const calls=Number(n),rate=Number(p);
 if(!Number.isInteger(calls)||calls<1||calls>10000||!Number.isFinite(rate)||rate<0||rate>1)
   throw new RangeError('Provide a positive count and a probability from 0 to 1.');
 return 1-Math.pow(1-rate,calls);
}
const protocols=Object.freeze({
 latency:{
  category:'I / 01 — SYSTEM RELIABILITY',status:'SIMULATED / NOT MEASURED',
  title:'If one backend is slow, how does fan-out change the odds?',
  hypothesis:'If independent downstream requests each have the same chance of being slow, making more requests increases the chance that at least one is slow.',
  falsifier:'Correlated latency, hedged requests, caching, or a different aggregation rule can make this simple model a poor predictor of real response time.',
  next:'Run repeated client-side simulations and compare their measured frequency with the theoretical probability. Then vary correlations and identify the model’s limits.',
  link:'articles/165015680-scryer-netflixs-predictive-auto-scaling-engine-82db2049ca47.html',
  linkText:'Read the published Netflix Scryer essay ↗',
  simulator:true
 },
 consistency:{
  category:'I / 02 — DISTRIBUTED CONSISTENCY',status:'PROPOSED / NO BENCHMARKS',
  title:'When a replica recovers, what does the next read promise?',
  hypothesis:'An application that treats availability as equivalent to freshness can surface stale data after an interruption.',
  falsifier:'A test that reads only a known leader under a strong consistency protocol might not exhibit the stale-read behavior being investigated.',
  next:'Specify a client-visible invariant. Introduce delayed replication and failover in a local simulation, record operation histories, then check the invariant—not just whether the service responds.',
  link:'articles/165015687-leslie-lamport-genius-behind-computers-working-together-fe1d2415aee8.html',
  linkText:'Read the published Leslie Lamport essay ↗',
  simulator:false
 },
 learning:{
  category:'I / 03 — MODEL EVALUATION',status:'PROPOSED / NO RESULTS',
  title:'When does accuracy conceal a model’s weaknesses?',
  hypothesis:'An aggregate test score can hide failures on uncommon cases or under a changed input distribution.',
  falsifier:'Balanced data, stable deployment inputs, and well-calibrated subgroup performance would weaken the specific failure prediction.',
  next:'Choose a public dataset, publish a simple baseline, record the train/test split, inspect per-class errors, and perturb inputs with a reproducible evaluation script.',
  link:'https://scikit-learn.org/stable/modules/model_evaluation.html',
  linkText:'Study model evaluation methods ↗',
  simulator:false
 },
 frontend:{
  category:'I / 04 — USER INTENT & CORRECTNESS',status:'PROPOSED / NO BENCHMARKS',
  title:'Can safe rendering preserve the user’s original intent?',
  hypothesis:'A sanitizer can prevent unsafe markup while unexpectedly changing visible formatting or interaction semantics.',
  falsifier:'If a defined set of editing operations preserves both safety and rendering invariants across browsers, the suspected class of failures may not occur.',
  next:'Define user-intent and safety invariants, create minimal HTML fixtures, compare editor output and rendered output, then test keyboard and screen-reader behavior.',
  link:'#work',
  linkText:'Explore the engineering atlas ↗',
  simulator:false
 }
});
if(typeof module!=='undefined'&&module.exports)module.exports={fanOutRisk,protocols};
const doc=root.document;if(!doc)return;
const buttons=[...doc.querySelectorAll('[data-inquiry]')];
const container=doc.getElementById('inquiry');
if(!container)return;
const field=id=>doc.getElementById(id);
const n=field('inquiry-services'),p=field('inquiry-slow-rate');
function setText(id,value){const el=field(id);if(el)el.textContent=value;}
function compute(){
 if(!n||!p)return;
 const calls=Number(n.value),rate=Number(p.value)/100;
 const risk=fanOutRisk(calls,rate);
 const display=(risk*100).toFixed(1)+'%';
 setText('inquiry-services-value',String(calls));
 setText('inquiry-rate-value',String(Math.round(rate*100))+'%');
 setText('inquiry-risk',display);
 const bar=field('inquiry-risk-bar');if(bar)bar.style.width=display;
}
function select(id){
 const data=Object.prototype.hasOwnProperty.call(protocols,id)?protocols[id]:protocols.latency;
 setText('inquiry-category',data.category);
 setText('inquiry-status',data.status);
 setText('inquiry-question-title',data.title);
 setText('inquiry-hypothesis',data.hypothesis);
 setText('inquiry-falsifier',data.falsifier);
 setText('inquiry-next',data.next);
 const a=field('inquiry-reading');if(a){a.textContent=data.linkText;a.href=data.link}
 const simulator=field('inquiry-simulator');
 if(simulator)simulator.hidden=!data.simulator;
 for(const b of buttons){
  const active=b.dataset.inquiry===id;
  b.classList.toggle('is-active',active);
  b.setAttribute('aria-pressed',String(active));
 }
 return data;
}
n?.addEventListener('input',compute);
p?.addEventListener('input',compute);
buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.inquiry)));
compute();select('latency');
})(typeof window!=='undefined'?window:globalThis);
