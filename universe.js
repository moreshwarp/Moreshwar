/* Theme Studio / visual universe selector.
   Original palettes, typography and abstract motifs inspired by broad creative genres;
   independent of Marvel, DC, The Big Bang Theory, Naruto or any other IP owners. */
(function(root) {
 'use strict';
 const KEY='moreshwar-universe-v1';
 const UNIVERSES=Object.freeze({
  science:{name:'The Science Lab',tag:'LAB / EXPERIMENT 01',eyebrow:'SCIENCE · ENGINEERING · CURIOSITY'},
  hero:{name:'Hero Protocol',tag:'HERO / SIGNAL 02',eyebrow:'CINEMATIC HEROISM · ENGINEERING'},
  noir:{name:'Midnight Detective',tag:'NOIR / INVESTIGATION 03',eyebrow:'DEDUCTION · DESIGN · DISCOVERY'},
  quantum:{name:'Quantum Banter',tag:'QUANTUM / EQUATION 04',eyebrow:'PHYSICS · WIT · QUESTIONS'},
  shinobi:{name:'Shinobi Code',tag:'SHINOBI / DISCIPLINE 05',eyebrow:'PATTERNS · PATIENCE · PRACTICE'},
  bureau:{name:'The Hidden Bureau',tag:'BUREAU / CHOICE 06',eyebrow:'SYSTEMS · CHOICES · POSSIBILITY'},
  nature:{name:'Natural Systems',tag:'NATURE / FIELD 07',eyebrow:'ADAPTATION · ECOLOGY · SYSTEMS'},
  terminal:{name:'Hacker Terminal',tag:'TERMINAL / SESSION 08',eyebrow:'OPEN SOURCE · CURIOSITY · CODE'},
  circuit:{name:'Computer Science',tag:'CIRCUIT / GRAPH 09',eyebrow:'ALGORITHMS · ABSTRACTIONS · CODE'},
  arcade:{name:'Retro Simulation',tag:'ARCADE / LEVEL 10',eyebrow:'EXPERIMENTATION · GAMES · PLAY'}
 });
 const universeIDs=Object.keys(UNIVERSES);
 const normalizeUniverse=x=>typeof x==='string'&&Object.prototype.hasOwnProperty.call(UNIVERSES,x)?x:null;
 const getInitialUniverse=stored=>normalizeUniverse(stored)||'science';
 if(typeof module!=='undefined'&&module.exports)
  module.exports={UNIVERSES,universeIDs,normalizeUniverse,getInitialUniverse};
 const doc=root.document;
 if(!doc)return;
 const store=(()=>{try{return root.localStorage}catch{return null}})();
 const readSaved=()=>{try{return store?.getItem(KEY)}catch{return null}};
 const save=key=>{try{store?.setItem(KEY,key)}catch{}};
 const dialog=doc.getElementById('theme-studio');
 const label=doc.getElementById('universe-current-label');
 const tag=doc.getElementById('universe-instrument-tag');
 const eyebrow=doc.getElementById('universe-eyebrow');
 const triggers=[doc.getElementById('universe-trigger'),doc.getElementById('universe-mobile-trigger')].filter(Boolean);
 const choices=[...doc.querySelectorAll('[data-universe-select]')];
 const modes=[...doc.querySelectorAll('[data-brightness]')];
 let previousTrigger=null;
 function activate(id,{persist=true}={}){
  const key=normalizeUniverse(id)||'science';
  doc.documentElement.dataset.universe=key;
  if(persist)save(key);
  if(label)label.textContent=UNIVERSES[key].name;
  if(tag)tag.textContent=UNIVERSES[key].tag;
  if(eyebrow)eyebrow.textContent=UNIVERSES[key].eyebrow;
  for(const button of choices){
   const active=button.dataset.universeSelect===key;
   button.classList.toggle('active',active);
   button.setAttribute('aria-pressed',String(active));
  }
  for(const trigger of triggers){
   trigger.setAttribute('title','Open Theme Studio · '+UNIVERSES[key].name);
  }
  return key;
 }
 function refreshModes(){
  const mode=doc.documentElement.dataset.theme||'dark';
  modes.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.brightness===mode)));
 }
 function openStudio(trigger){
  if(!dialog)return;
  previousTrigger=trigger;
  refreshModes();
  try{
   if(typeof dialog.showModal==='function')dialog.showModal();
   else dialog.setAttribute('open','');
  }catch(error){if(!dialog.open)dialog.setAttribute('open','')}
  doc.getElementById('theme-studio-close')?.focus();
 }
 function closeStudio(){
  if(!dialog)return;
  if(typeof dialog.close==='function'&&dialog.open)dialog.close();
  else dialog.removeAttribute('open');
  // The mobile menu is still present behind the dialog, so restore focus
  // to its trigger after closing rather than trapping it in the overlay.
  try{previousTrigger?.focus()}catch{}
 }
 triggers.forEach(trigger=>trigger.addEventListener('click',()=>openStudio(trigger)));
 doc.getElementById('theme-studio-close')?.addEventListener('click',closeStudio);
 doc.getElementById('universe-reset')?.addEventListener('click',()=>{activate('science');closeStudio()});
 if(dialog) {
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeStudio()});
  dialog.addEventListener('close',()=>{try{previousTrigger?.focus()}catch{}});
 }
 choices.forEach(button=>button.addEventListener('click',()=>{
  activate(button.dataset.universeSelect);
  closeStudio();
 }));
 modes.forEach(button=>button.addEventListener('click',()=>{
  const desired=button.dataset.brightness;
  if(!['light','dark'].includes(desired))return;
  const actual=doc.documentElement.dataset.theme;
  if(desired!==actual){
   const toggle=doc.getElementById('theme-toggle');
   if(toggle)toggle.click();else doc.documentElement.dataset.theme=desired;
  }
  refreshModes();
 }));
 doc.getElementById('theme-toggle')?.addEventListener('click',refreshModes);
 activate(getInitialUniverse(readSaved()),{persist:false});
 refreshModes();
})(typeof window!=='undefined'?window:globalThis);
