/* Accessible, persistent light/dark appearance.
   Defaults to operating-system preference; explicit choice overrides on every page. */
(function(root){
 'use strict';
 const KEY='moreshwar-theme-v1';
 const LIGHT='light',DARK='dark';
 function normalize(value){return value===LIGHT||value===DARK?value:null;}
 function preferred(systemIsLight){return systemIsLight?LIGHT:DARK;}
 function getInitial(stored,systemIsLight){return normalize(stored)||preferred(systemIsLight);}
 function nextTheme(current){return current===LIGHT?DARK:LIGHT;}
 function getSafeStorage(){
   try{return root.localStorage;}catch{return null}
 }
 if(typeof module!=='undefined' && module.exports)
   module.exports={normalize,preferred,getInitial,nextTheme};
 const doc=root.document;
 if(!doc)return;
 const store=getSafeStorage();
 // Reader pages retain the selected visual universe without needing the chooser dialog.
 const currentUniverse=(()=>{try{return store?.getItem('moreshwar-universe-v1')}catch{return null}})();
 const allowedUniverse=new Set(['science','hero','noir','quantum','shinobi','bureau','nature','terminal','circuit','arcade']);
 doc.documentElement.dataset.universe=allowedUniverse.has(currentUniverse)?currentUniverse:'science';
 const colorScheme=root.matchMedia?root.matchMedia('(prefers-color-scheme: light)'):null;
 const readStored=()=>{try{return store?.getItem(KEY)}catch{return null}};
 const applyTheme=(theme,{persist=false}={})=>{
   const value=normalize(theme)||DARK;
   doc.documentElement.dataset.theme=value;
   doc.documentElement.style.colorScheme=value;
   if(persist)try{store?.setItem(KEY,value)}catch{}
   const meta=doc.querySelector('meta[name="theme-color"]');
   if(meta)meta.setAttribute('content',value===LIGHT?'#f5f9fb':'#080d14');
   doc.querySelectorAll('.theme-toggle,.reader-theme-toggle').forEach(button=>{
     const switchTo=nextTheme(value);
     button.setAttribute('aria-label','Switch to '+switchTo+' mode');
     button.setAttribute('title','Switch to '+switchTo+' mode');
     button.setAttribute('aria-pressed',String(value===LIGHT));
     const icon=button.querySelector('.theme-toggle-icon');
     const text=button.querySelector('.theme-toggle-text');
     if(icon)icon.textContent=value===LIGHT?'☾':'☼';
     if(text)text.textContent=value===LIGHT?'Dark':'Light';
   });
 };
 // The article readers share this file: add an accessible control without editing their markup twice.
 if(!doc.querySelector('#theme-toggle') && (doc.querySelector('.top nav')||doc.querySelector('.site-nav .nav-links'))){
   const button=doc.createElement('button');
   button.type='button';
   button.className='reader-theme-toggle';
   button.innerHTML='<span class="theme-toggle-icon" aria-hidden="true">☼</span><span class="theme-toggle-text">Light</span>';
   (doc.querySelector('.top nav')||doc.querySelector('.site-nav .nav-links')).append(button);
 }
 doc.querySelectorAll('.theme-toggle,.reader-theme-toggle').forEach(button=>{
   button.addEventListener('click',()=>applyTheme(nextTheme(doc.documentElement.dataset.theme),{persist:true}));
 });
 applyTheme(getInitial(readStored(),!!colorScheme?.matches));
 if(colorScheme?.addEventListener){
   colorScheme.addEventListener('change',event=>{
     if(!normalize(readStored()))applyTheme(preferred(event.matches));
   });
 }
})(typeof window!=='undefined'?window:globalThis);
