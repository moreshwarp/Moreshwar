/* Browser-side discovery over the public catalog generated at publication time. */
(()=>{
 const host=document.querySelector('[data-discovery]');if(!host)return;
 const input=host.querySelector('input'),select=host.querySelector('select'),status=host.querySelector('[role=status]'),list=host.querySelector('[data-results]');
 let entries=[];
 const safeURL=value=>{try{const u=new URL(value,document.baseURI);return u.protocol==='https:'||(u.origin===location.origin&&u.pathname.includes('/articles/'))?u:null}catch{return null}};
 function render(){
  const query=input.value.trim().toLocaleLowerCase(),kind=select.value;
  const results=entries.filter(e=>(kind==='All'||e.kind===kind)&&(`${e.title} ${e.summary}`).toLocaleLowerCase().includes(query));
  list.replaceChildren();
  for(const item of results.slice(0,6)){
   const url=safeURL(item.url);if(!url)continue;
   const card=document.createElement('a');card.className='discovery-card';card.href=url.href;
   if(url.origin!==location.origin){card.target='_blank';card.rel='noopener noreferrer'}
   const meta=document.createElement('span');meta.className='discovery-meta';meta.textContent=item.kind+(item.date?' / '+item.date:' / CURATED SOURCE');
   const title=document.createElement('h3');title.textContent=item.title;
   const description=document.createElement('p');description.textContent=item.summary;
   const action=document.createElement('span');action.className='discovery-action';action.textContent=item.kind==='Essay'?`Read essay${item.minutes?' · '+item.minutes+' min':''} ↗`:'Visit podcast source ↗';
   card.append(meta,title,description,action);list.append(card);
  }
  status.textContent=results.length?`${results.length} results${results.length>6?' · showing the first 6':''}`:'No matches. Try a broader term or choose all formats.';
 }
 input.addEventListener('input',render);select.addEventListener('change',render);
 fetch('data/research-catalog.json').then(r=>{if(!r.ok)throw Error('Catalog unavailable');return r.json()}).then(data=>{
  if(!Array.isArray(data.entries))throw Error('Invalid catalog');entries=data.entries;input.disabled=false;select.disabled=false;render();
 }).catch(()=>{status.textContent='Discovery is unavailable. Browse all writing or science below.';});
})();
