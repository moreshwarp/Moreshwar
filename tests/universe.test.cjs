// Creative theme studio regression suite — npm-free Node test runner.
// Run: node --test tests/*.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');
const css=read('universe.css');
const fix=read('mobile-fix.css');
const source=read('universe.js');
const reader=read('reader-theme.css');
const {UNIVERSES,universeIDs,normalizeUniverse,getInitialUniverse}=require('../universe.js');
test('all ten selections are valid and unsafe values are rejected',()=>{
 assert.equal(universeIDs.length,10);
 assert.deepEqual(universeIDs,['science','hero','noir','quantum','shinobi','bureau','nature','terminal','circuit','arcade']);
 for(const id of universeIDs)assert.equal(normalizeUniverse(id),id);
 for(const bad of ['constructor','__proto__','<script>','no-such-theme','',null,12]){
  assert.equal(normalizeUniverse(bad),null);
 }
 assert.equal(getInitialUniverse('unlisted'),'science');
 assert.equal(getInitialUniverse('hero'),'hero');
});
test('every theme has an accessible chooser button and uniquely styled preview',()=>{
 const choices=[...html.matchAll(/data-universe-select="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(choices,universeIDs);
 assert.match(html,/id="theme-studio" class="theme-studio" aria-labelledby="theme-studio-title"/);
 assert.match(html,/id="theme-studio-close"/);
 assert.match(html,/id="universe-trigger"/);
 assert.match(html,/id="universe-mobile-trigger"/);
 assert.match(css,/\.theme-studio::backdrop/);
 for(const key of universeIDs){
  assert.ok(Object.hasOwn(UNIVERSES,key));
  assert.ok(html.includes('data-preview="'+key+'"'));
  assert.ok(css.includes('data-universe="'+key+'"') || key==='science');
 }
});
test('source uses persistence and restores valid themes across visits',()=>{
 assert.match(html,/moreshwar-universe-v1/);
 assert.match(source,/localStorage/);
 assert.match(source,/setItem\(KEY,key\)/);
 assert.match(read('theme.js'),/moreshwar-universe-v1/);
 assert.match(reader,/universe\.css/);
 assert.match(reader,/data-universe/);
});
test('selector preserves light and dark choices and operates keyboard-accessibly',()=>{
 assert.match(html,/data-brightness="dark"/);
 assert.match(html,/data-brightness="light"/);
 assert.match(source,/aria-pressed/);
 assert.match(source,/showModal/);
 assert.match(source,/dialog\.close/);
 assert.match(source,/previousTrigger\?\.focus\(\)/);
});
test('the mobile repair explicitly stacks the two overflowing siblings',()=>{
 assert.match(fix,/\.hero-visual\.computational-visual \.instrument-surface[\s\S]*?flex-direction:column/);
 assert.match(fix,/\.hero-visual\.computational-visual \.instrument-focus[\s\S]*?position:relative/);
 assert.match(fix,/\.instrument-svg[\s\S]*?width:100%/);
 assert.match(fix,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(fix,/@media\(max-width:430px\)/);
 assert.match(fix,/overflow-wrap:anywhere/);
});
test('theme control does not add a fifth icon to cramped mobile header',()=>{
 assert.match(css,/@media\(max-width:1050px\)\{\.universe-trigger\{display:none\}\}/);
 assert.match(css,/@media\(min-width:1051px\)\{\.mobile-theme-entry\{display:none\}\}/);
});
test('all original writing and interactive labs survive the redesign',()=>{
 assert.equal((html.match(/<li><a href="articles\//g)||[]).length,22);
 assert.equal((html.match(/class="fieldnote-card"/g)||[]).length,3);
 assert.equal((html.match(/class="lab-panel /g)||[]).length,3);
 assert.match(html,/id="contact-form"/);
 assert.match(html,/id="library"/);
 assert.match(html,/id="instrument-focus-title"/);
});
test('visual homages do not copy brands, logos or character images',()=>{
 assert.match(html,/Independent visual homages/);
 assert.doesNotMatch(html,/<img[^>]+(?:marvel|dc-comics|naruto|sheldon)/i);
});
test('simulated selection updates theme, selected states and local storage',()=>{
 const callbacks={};
 const item=id=>({
  dataset:{universeSelect:id},classList:{toggle(name,enabled){if(name==='active')this.active=enabled}},
  setAttribute(name,val){this[name]=val},addEventListener(ev,fn){callbacks[id+ev]=fn}
 });
 const choices=['science','hero','noir','quantum','shinobi','bureau','nature','terminal','circuit','arcade'].map(item);
 const trigger={addEventListener(){},setAttribute(){},focus(){this.focused=true}};
 const closes={listeners:{},addEventListener(ev,fn){this.listeners[ev]=fn},focus(){},setAttribute(){}};
 const dialog={open:false,listen:{},addEventListener(ev,fn){this.listen[ev]=fn},showModal(){this.open=true},close(){this.open=false},removeAttribute(){this.open=false}};
 const label={textContent:''},tag={textContent:''},eyebrow={textContent:''};
 const map={'theme-studio':dialog,'universe-current-label':label,'universe-instrument-tag':tag,'universe-eyebrow':eyebrow,
  'universe-trigger':trigger,'theme-studio-close':closes};
 const storage={contents:{},getItem(k){return this.contents[k]},setItem(k,v){this.contents[k]=v}};
 const doc={documentElement:{dataset:{theme:'dark'}},getElementById(id){return map[id]||null},
  querySelectorAll(sel){if(sel==='[data-universe-select]')return choices;return []}};
 vm.runInNewContext(source,{window:{document:doc,localStorage:storage},globalThis:{document:doc}});
 assert.equal(doc.documentElement.dataset.universe,'science');
 callbacks.heroclick();
 assert.equal(doc.documentElement.dataset.universe,'hero');
 assert.equal(label.textContent,'Hero Protocol');
 assert.equal(storage.contents['moreshwar-universe-v1'],'hero');
 assert.equal(choices[1]['aria-pressed'],'true');
 assert.equal(choices[0]['aria-pressed'],'false');
 callbacks.circuitclick();
 assert.equal(doc.documentElement.dataset.universe,'circuit');
 assert.equal(storage.contents['moreshwar-universe-v1'],'circuit');
});
test('theme studio serves ten distinct palette families, not just renamed labels',()=>{
 const keys=['hero','noir','quantum','shinobi','bureau','nature','terminal','circuit','arcade'];
 for(const key of keys)assert.match(css,new RegExp('data-universe="'+key+'"'));
 assert.match(css,/--world-tint/);
 assert.match(css,/--world-panel/);
 assert.match(css,/--world-light-accent/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('GitHub Pages deploys the theme files and browser fix together',()=>{
 const yaml=read('.github/workflows/pages.yml');
 for(const file of ['mobile-fix.css','universe.css','universe.js','theme.js','reader-theme.css'])
  assert.ok(yaml.includes(file),'missing deploy artifact: '+file);
});
