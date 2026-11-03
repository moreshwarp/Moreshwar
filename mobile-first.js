/* Moreshwar — zero-dependency mobile-first navigation and journal discovery.
   Content is read from the site's published essay archive; nothing is sent off-site. */
(()=>{
 'use strict';
 if(!document.body.classList.contains('mrl-mobile'))return;
 const dialog=document.createElement('dialog');
 dialog.className='mrl-search-dialog';
 dialog.id='mrl-global-search';
 dialog.setAttribute('aria-label','Search published essays');
 dialog.innerHTML='<div class="mrl-search-top"><div class="mrl-search-heading"><div><span class="mrl-search-kicker">Moreshwar / Discover</span><h2>Find a new idea.</h2></div><button class="mrl-search-close" type="button" aria-label="Close search">×</button></div><label class="mrl-search-input-wrap" for="mrl-search-input"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.6" cy="10.6" r="6.6"/><path d="m16 16 5 5"/></svg><input class="mrl-search-input" id="mrl-search-input" type="search" placeholder="Search published essays..." autocomplete="off"></label></div><div class="mrl-search-content"><p class="mrl-search-status" role="status" aria-live="polite">Start with a question or topic.</p><div class="mrl-search-results"></div><a class="mrl-search-more" href="reading-archive.html">Explore all published essays ↗</a></div>';
 document.body.append(dialog);
 const input=dialog.querySelector('#mrl-search-input'),status=dialog.querySelector('.mrl-search-status'),list=dialog.querySelector('.mrl-search-results');
 let cached=null,loading=null;
 function safeArticlePath(href){
  if(!href)return null;
  try{
   const u=new URL(href,location.href);
   const pieces=u.pathname.split('/articles/');
   if(pieces.length!==2||!pieces[1].endsWith('.html')||pieces[1].includes('..'))return null;
   return 'articles/'+pieces[1];
  }catch{return null}
 }
 async function load(){
  if(cached)return cached;
  if(loading)return loading;
  loading=(async()=>{
   const articleResponse=await fetch('reading-archive.html');
   if(!articleResponse.ok)throw Error('Local essay archive unavailable');
   const doc=new DOMParser().parseFromString(await articleResponse.text(),'text/html');
   const essays=[...doc.querySelectorAll('a.story')].map(el=>{
    const title=el.querySelector('h2')?.textContent?.trim()||'';
    return {kind:'Essay',title,href:safeArticlePath(el.getAttribute('href')),search:(el.dataset.search||title).toLocaleLowerCase()};
   }).filter(x=>x.title&&x.href);
   cached=essays;return cached;
  })();
  try{return await loading}finally{loading=null}
 }
 function render(){
  const q=input.value.trim().toLocaleLowerCase();
  list.replaceChildren();
  if(!cached){status.textContent='Loading published essays…';return}
  const matched=q?cached.filter(x=>x.search.includes(q)):cached.slice(0,6);
  const shown=matched.slice(0,16);
  status.textContent=q?(matched.length+' matching '+(matched.length===1?'item':'items')):'A few places to begin';
  if(!shown.length){
   const p=document.createElement('p');p.className='mrl-search-empty';p.textContent='No matches. Try a topic such as systems, Netflix, science, or mathematics.';list.append(p);return;
  }
  for(const item of shown){
   const a=document.createElement('a');a.className='mrl-search-result';a.href=item.href;
   const wrap=document.createElement('span'),title=document.createElement('strong'),meta=document.createElement('small');
   title.textContent=item.title;meta.textContent=item.kind+(item.author?' · '+item.author:'');
   wrap.append(title,meta);const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';a.append(wrap,arrow);list.append(a);
  }
  if(matched.length>shown.length){const p=document.createElement('p');p.className='mrl-search-empty';p.textContent='Showing the first '+shown.length+' results. Add another keyword to narrow your search.';list.append(p)}
 }
 async function open(){
  if(!dialog.open){dialog.showModal();input.focus()}
  render();
  try{await load();if(dialog.open)render()}
  catch{if(dialog.open){status.textContent='Search temporarily unavailable';list.replaceChildren();const p=document.createElement('p');p.className='mrl-search-empty';p.textContent='Open the essay archive to search published writing.';list.append(p)}}
 }
 document.querySelectorAll('[data-mrl-search]').forEach(el=>el.addEventListener('click',open));
 dialog.querySelector('.mrl-search-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 input.addEventListener('input',render);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&dialog.open){event.preventDefault();event.stopPropagation();dialog.close();return}if((event.ctrlKey||event.metaKey)&&event.key.toLocaleLowerCase()==='k'){event.preventDefault();if(dialog.open)dialog.close();else open()}},true);
 const archiveInput=document.getElementById('q');
 if(archiveInput){
  const initial=new URLSearchParams(location.search).get('q');
  if(initial){archiveInput.value=initial;archiveInput.dispatchEvent(new Event('input',{bubbles:true}))}
  document.querySelectorAll('[data-mrl-query]').forEach(btn=>{
   btn.addEventListener('click',()=>{
    const q=btn.getAttribute('data-mrl-query')||'';
    archiveInput.value=q;archiveInput.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelectorAll('[data-mrl-query]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
   });
  });
 }
})();
