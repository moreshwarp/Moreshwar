/* Scientific hero visual: clickable display lenses without WebGL.
   Static SVG is usable even when this script fails or motion is reduced. */
(function(root){
 'use strict';
 const LENSES={
  systems:{title:'SYSTEMS SOFTWARE',description:'Failures, coordination & consistency'},
  ai:{title:'MACHINE LEARNING',description:'Models, evaluation & uncertainty'},
  frontend:{title:'FRONTEND ENGINEERING',description:'Browser behavior, state & usability'}
 };
 function knownLens(value){return Object.prototype.hasOwnProperty.call(LENSES,value);}
 if(typeof module!=='undefined'&&module.exports)module.exports={LENSES,knownLens};
 const doc=root.document;if(!doc)return;
 const surface=doc.getElementById('instrument-surface');
 const buttons=[...doc.querySelectorAll('[data-instrument-mode]')];
 if(!surface||!buttons.length)return;
 const title=doc.getElementById('instrument-focus-title');
 const note=doc.getElementById('instrument-focus-note');
 const render=(value)=>{
  if(!knownLens(value))return;
  surface.dataset.mode=value;
  if(title)title.textContent=LENSES[value].title;
  if(note)note.textContent=LENSES[value].description;
  buttons.forEach(button=>{
   const selected=button.dataset.instrumentMode===value;
   button.classList.toggle('active',selected);
   button.setAttribute('aria-pressed',String(selected));
  });
 };
 buttons.forEach((button,i)=>{
  button.addEventListener('click',()=>render(button.dataset.instrumentMode));
  button.addEventListener('keydown',event=>{
   if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
   event.preventDefault();
   const step=event.key==='ArrowRight'?1:-1;
   const next=buttons[(i+step+buttons.length)%buttons.length];
   next.focus();render(next.dataset.instrumentMode);
  });
 });
 const match=root.matchMedia?root.matchMedia('(prefers-reduced-motion: reduce)'):null;
 const applyPaused=()=>surface.classList.toggle('instrument-paused',
  !!doc.hidden||!!match?.matches||doc.body.classList.contains('reduce-motion'));
 doc.addEventListener('visibilitychange',applyPaused);
 match?.addEventListener?.('change',applyPaused);
 render('systems');applyPaused();
})(typeof window!=='undefined'?window:globalThis);
