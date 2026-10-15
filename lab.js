/* Working, browser-local systems thought experiments.
   The outputs are mathematical illustrations, not performance benchmarks or production traces.
   No external libraries, network calls, or telemetry required. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const fanout = $('lab-fanout');
 const slow = $('lab-slow');
 const arrival = $('lab-arrival');
 const primaryElement = $('lab-primary-val');
 if (!fanout || !slow || !arrival || !primaryElement) return;
 const clamp = (x,min,max) => Math.max(min,Math.min(max,x));
 const asInt = v => Number.parseInt(v,10) || 0;
 function renderFanout() {
  const n=clamp(asInt(fanout.value),1,48),p=clamp(asInt(slow.value),1,30)/100;
  const probability=1-Math.pow(1-p,n);
  $('lab-fanout-value').textContent=String(n);
  $('lab-slow-value').textContent=Math.round(p*100)+'%';
  $('lab-tail-prob').textContent=(probability*100).toFixed(1)+'%';
  $('lab-tail-fill').style.width=(probability*100).toFixed(2)+'%';
  const container=$('lab-fanout-nodes');
  const markerCount=Math.min(n,Math.round(n*p)); // Illustrative expected count, not observed samples.
  const fragment=document.createDocumentFragment();
  for(let k=0;k<n;k++){
   const dot=document.createElement('span');
   dot.style.setProperty('--delay',Math.min(k,18)*0.018+'s');
   if(k<markerCount)dot.classList.add('slow');
   fragment.appendChild(dot);
  }
  container.replaceChildren(fragment);
  container.setAttribute('aria-label',n+' displayed dependencies, '+markerCount+' highlighted for illustrative expected slow count');
 }
 function renderQueue() {
  const lambda=clamp(asInt(arrival.value),1,23),mu=20,rho=lambda/mu;
  $('lab-arrival-value').textContent=lambda+' req/s';
  $('lab-utilization').textContent=(rho*100).toFixed(0)+'%';
  $('lab-queue-arrivals').style.width=clamp(rho*100,0,100)+'%';
  const overloaded=lambda>=mu;
  $('lab-queue-response').textContent=overloaded?'No steady state':(1000/(mu-lambda)).toFixed(0)+' ms';
  $('lab-queue-note').textContent=overloaded
   ? 'λ ≥ μ. No finite stationary mean response time exists under the M/M/1 assumptions; this does not mean individual requests literally take infinite time.'
   : 'W = 1 / (μ − λ), for λ < μ. Ideal single-server queue with Poisson arrivals and exponential service.';
  $('lab-queue-response').style.color=overloaded?'#f8b8a5':'';
 }
 let primary=0,replica=0,partition=false;
 function renderReplica(){
  primaryElement.textContent=String(primary);
  $('lab-replica-val').textContent=String(replica);
  $('lab-replica-link').classList.toggle('partitioned',partition);
  $('lab-partition').setAttribute('aria-pressed',String(partition));
  $('lab-partition').textContent=partition?'Restore link':'Pause link';
  $('lab-deliver').disabled=partition||replica===primary;
  const status= $('lab-replica-status');
  if(partition) status.textContent=replica===primary?'Link paused · in sync':'Link paused · stale';
  else if(replica!==primary)status.textContent='Stale by '+(primary-replica)+' write'+(primary-replica===1?'':'s');
  else status.textContent='Up to date';
  status.style.color=replica===primary?'#a2f7db':'#f7c59f';
 }
 $('lab-write').addEventListener('click',()=>{primary++;renderReplica()});
 $('lab-deliver').addEventListener('click',()=>{if(partition)return;replica=primary;renderReplica()});
 $('lab-partition').addEventListener('click',()=>{partition=!partition;renderReplica()});
 $('lab-reset').addEventListener('click',()=>{primary=0;replica=0;partition=false;renderReplica()});
 fanout.addEventListener('input',renderFanout);
 slow.addEventListener('input',renderFanout);
 arrival.addEventListener('input',renderQueue);
 renderFanout();renderQueue();renderReplica();
})();
