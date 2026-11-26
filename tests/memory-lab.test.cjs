// Memory Wall Lab: the page measures the visitor's own machine, so the honesty of the
// method and its stated limits matter as much as the code working.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=(f)=>fs.readFileSync(f,'utf8');
const page=read('memory-lab/index.html'), lab=read('memory-lab/lab.js'), worker=read('memory-lab/bench-worker.js');

test('the lab states that it measures rather than simulates, and keeps data local',()=>{
  assert.match(page,/measured, not simulated/);
  assert.match(page,/Nothing here is simulated and nothing is sent anywhere/);
  assert.doesNotMatch(page,/fetch\(['"]https?:/);
  assert.doesNotMatch(lab,/fetch\(['"]https?:/);
});

test('the method and its limits are both published on the page',()=>{
  for(const id of ['run-it','method','limits','why'])assert.ok(page.includes('id="'+id+'"'),id);
  assert.match(page,/What this cannot tell you/);
  assert.match(page,/upper bounds/);           // JS overhead admitted
  assert.match(page,/inferred, not read/);     // cache sizes not read from the OS
  assert.match(page,/translation/);            // TLB effects admitted
});

test('the measurement defeats prefetching and reports clock resolution',()=>{
  assert.match(worker,/Fisher-Yates/);                 // random order, not a stride
  assert.match(worker,/clockResolution/);
  assert.match(worker,/const LINE = 64/);              // one node per cache line
  assert.match(worker,/calibrate/);                    // amortise around a coarse clock
  assert.match(page,/Clock resolution/);               // and surface it to the reader
});

test('repeats are reduced by minimum, not mean, and the chase cannot be optimised away',()=>{
  assert.match(worker,/runs\.sort\(\(a, b\) => a - b\)/);
  assert.match(worker,/ns: runs\[0\]/);
  assert.match(worker,/sink/);
});

test('the lab runs off the main thread and ships its worker',()=>{
  assert.match(lab,/new Worker\('bench-worker\.js'\)/);
  assert.ok(fs.existsSync('memory-lab/bench-worker.js'));
  assert.match(read('scripts/prepare-site.cjs'),/'memory-lab'/);
});

test('readings can be exported with their caveats attached',()=>{
  assert.match(lab,/caveats/);
  assert.match(lab,/clockResolutionMs/);
  assert.match(page,/id="export"/);
});

test('every local link and asset on the lab page resolves',()=>{
  const ids=new Set([...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const [,url] of page.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(https?:|mailto:)/.test(url))continue;
    const [file,frag]=url.split('#');
    if(file)assert.ok(fs.existsSync(path.resolve('memory-lab',file.split('?')[0])),url);
    if(frag&&!file)assert.ok(ids.has(frag),url);
  }
});

test('the lab is reachable from the homepage and the research page',()=>{
  for(const f of ['index.html','studio.html'])assert.match(read(f),/href="memory-lab\/index\.html"/,f);
});

test('new additions are flagged from a dated manifest',()=>{
  const data=JSON.parse(read('data/whats-new.json'));
  assert.ok(Number(data.freshDays)>0);
  assert.ok(data.entries.length>0);
  for(const e of data.entries){
    assert.match(e.date,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(e.title&&e.href);
    const target=e.href.split('#')[0];
    assert.ok(fs.existsSync(target),'whats-new points at a missing page: '+target);
  }
  const runtime=read('lab-site.js');
  assert.match(runtime,/data\/whats-new\.json/);
  assert.match(runtime,/data-added/);
  assert.match(read('lab-site.css'),/\.new-flag/);
  assert.match(read('scripts/prepare-site.cjs'),/whats-new\.json/);
});
