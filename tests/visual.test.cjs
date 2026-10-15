// UI, scientific-visual, reading-page and theming regression suite.
// No browser/runtime dependency is needed for the pure functions and event simulations.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const themeCSS=read('visual-theme.css');
const readerCSS=read('reader-theme.css');
const themeJS=read('theme.js');
const graphJS=read('visual.js');
const {normalize,preferred,getInitial,nextTheme}=require('../theme.js');
const {LENSES,knownLens}=require('../visual.js');

test('three color modes: default dark, OS preference, explicit saved choice',()=>{
 assert.equal(preferred(false),'dark');
 assert.equal(preferred(true),'light');
 assert.equal(getInitial(null,false),'dark');
 assert.equal(getInitial(null,true),'light');
 assert.equal(getInitial('dark',true),'dark');
 assert.equal(getInitial('light',false),'light');
 assert.equal(normalize('not-a-theme'),null);
 assert.equal(nextTheme('dark'),'light');
 assert.equal(nextTheme('light'),'dark');
});
test('theme control is present, named, semantic and persistent',()=>{
 assert.match(html,/id="theme-toggle"/);
 assert.match(html,/aria-label="Switch color theme"/);
 assert.match(html,/<script defer src="theme\.js\?v=[^"]+"><\/script>/);
 assert.match(html,/localStorage\.getItem\('moreshwar-theme-v1'\)/);
 assert.match(themeJS,/setItem\(KEY,value\)/);
 assert.match(themeJS,/aria-pressed/);
});
test('homepage and readers both support dark and light color schemes',()=>{
 assert.match(themeCSS,/:root\[data-theme="light"\]/);
 assert.match(themeCSS,/color-scheme:light/);
 assert.match(themeCSS,/prefers-reduced-motion:reduce/);
 assert.match(readerCSS,/:root\[data-theme="light"\]/);
 assert.match(readerCSS,/reader-theme-toggle/);
});
test('all 25 original and educational article reading pages use the same theme',()=>{
 const pages=fs.readdirSync(path.join(root,'articles')).filter(f=>f.endsWith('.html'));
 assert.equal(pages.length,25);
 for(const p of pages){
  const source=read('articles/'+p);
  assert.match(source,/\.\.\/reader-theme\.css\?v=viz-theme-/);
  assert.match(source,/\.\.\/theme\.js\?v=viz-theme-/);
  assert.match(source,/moreshwar-theme-v1/);
  assert.match(source,/<\/head>/);
 }
});
test('hero uses real SVG markup with visible scene before JS/WebGL loads',()=>{
 assert.match(html,/class="hero-visual computational-visual"/);
 assert.match(html,/class="instrument-svg"/);
 assert.match(html,/id="instrument-surface" data-mode="systems"/);
 assert.match(html,/id="instrument-focus-title"/);
 assert.doesNotMatch(html,/<canvas id="system-canvas"/);
 assert.match(themeCSS,/\.hero\.shell/);
 assert.match(themeCSS,/grid-template-columns:minmax\(0,1\.06fr\)/);
});
test('scientific visualization controls have known lenses and accessible pressed states',()=>{
 const tabs=[...html.matchAll(/data-instrument-mode="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(tabs,['systems','ai','frontend']);
 assert.ok(tabs.every(knownLens));
 assert.equal(knownLens('secret'),false);
 assert.equal(Object.keys(LENSES).length,3);
 assert.match(graphJS,/aria-pressed/);
 assert.match(graphJS,/ArrowLeft/);
 assert.match(graphJS,/ArrowRight/);
});
test('work heading left-side graphic replaces the blank column',()=>{
 assert.match(html,/class="section-top reveal atlas-intro"/);
 assert.match(html,/class="atlas-map" role="img"/);
 assert.match(html,/class="atlas-intro-copy"/);
 assert.match(html,/id="work"/);
 assert.match(themeCSS,/\.work-section \.section-top\.atlas-intro/);
});
test('responsive layouts and reduced motion do not depend on Three.js',()=>{
 for(const width of ['1200','960','720','420'])
  assert.ok(themeCSS.includes('@media(max-width:'+width+'px)'),width);
 assert.match(themeCSS,/instrument-paused/);
 assert.match(themeCSS,/body\.reduce-motion/);
 assert.match(themeCSS,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(graphJS,/import\(/);
});
test('existing content and functional labs survived the visual redesign',()=>{
 assert.equal((html.match(/<li><a href="articles\//g)||[]).length,22);
 assert.equal((html.match(/class="fieldnote-card"/g)||[]).length,3);
 assert.equal((html.match(/class="lab-panel /g)||[]).length,3);
 assert.equal((html.match(/class="project-card reveal"/g)||[]).length,6);
 assert.match(html,/id="contact-form"/);
 assert.match(html,/id="library"/);
 assert.match(html,/id="research"/);
 assert.match(html,/id="writing"/);
});
test('diagram is clearly conceptual, not fabricated live performance evidence',()=>{
 assert.match(html,/NOT PRODUCTION DATA/);
 assert.match(html,/CONCEPTUAL GRAPH/);
 assert.match(html,/EXPLORATORY/);
});
test('every theme/visual dependency will be deployable from the Pages workflow',()=>{
 const wf=read('.github/workflows/pages.yml');
 for(const file of ['visual-theme.css','theme.js','visual.js','reader-theme.css'])
  assert.ok(wf.includes(file),'Missing '+file);
});
test('client-side theme works without a web browser when unit-tested',()=>{
 const on={};
 const labels={};
 const node={dataset:{theme:'dark'},style:{}};
 const icon={textContent:'☼'};
 const text={textContent:'Light'};
 const button={attrs:{},addEventListener(type,fn){on[type]=fn},setAttribute(k,v){this.attrs[k]=v},
   querySelector(sel){return sel==='.theme-toggle-icon'?icon:sel==='.theme-toggle-text'?text:null}};
 const meta={setAttribute(k,v){labels[k]=v}};
 const store={contents:{},getItem(k){return this.contents[k]||null},setItem(k,v){this.contents[k]=v}};
 const doc={documentElement:node,querySelector(sel){return sel==='meta[name="theme-color"]'?meta:null},
  querySelectorAll(){return [button]}};
 const fakeWin={document:doc,localStorage:store,matchMedia(){return {matches:false,addEventListener(){}}}};
 vm.runInNewContext(themeJS,{window:fakeWin,globalThis:fakeWin});
 assert.equal(node.dataset.theme,'dark');
 assert.equal(button.attrs['aria-label'],'Switch to light mode');
 on.click();
 assert.equal(node.dataset.theme,'light');
 assert.equal(store.contents['moreshwar-theme-v1'],'light');
 assert.equal(labels.content,'#f5f9fb');
 assert.equal(button.attrs['aria-pressed'],'true');
 assert.equal(icon.textContent,'☾');
 on.click();
 assert.equal(store.contents['moreshwar-theme-v1'],'dark');
});
test('interactive SVG lens updates title and ARIA state without affecting other data',()=>{
 const surface={dataset:{mode:'systems'},classList:{toggle(){}}};
 const title={textContent:''},note={textContent:''};
 const map={'instrument-surface':surface,'instrument-focus-title':title,'instrument-focus-note':note};
 const button=(mode)=>({dataset:{instrumentMode:mode},attrs:{},events:{},classList:{toggle(){}},
  setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this.events[k]=fn},focus(){this.focused=true}});
 const buttons=['systems','ai','frontend'].map(button);
 const doc={getElementById(k){return map[k]},querySelectorAll(){return buttons},
  addEventListener(){},body:{classList:{contains(){return false}}},hidden:false};
 const fakeWin={document:doc,matchMedia(){return {matches:false,addEventListener(){}}}};
 vm.runInNewContext(graphJS,{window:fakeWin,globalThis:fakeWin});
 assert.equal(title.textContent,'SYSTEMS SOFTWARE');
 buttons[1].events.click();
 assert.equal(surface.dataset.mode,'ai');
 assert.equal(title.textContent,'MACHINE LEARNING');
 assert.equal(buttons[1].attrs['aria-pressed'],'true');
 assert.equal(buttons[0].attrs['aria-pressed'],'false');
 buttons[1].events.keydown({key:'ArrowRight',preventDefault(){}});
 assert.equal(surface.dataset.mode,'frontend');
 assert.ok(buttons[2].focused);
});
