/* Science & Ideas: source-linked rotating ideas, English listening library and 2026 science Nobel stories.
 * All content comes from a version-controlled JSON file. No third-party embed, API token, or tracking.
 * "Thoughts" are original paraphrases, not word-for-word quotations.
 */
(function(root) {
 'use strict';
 const doc=root.document;
 if(!doc)return;
 const host=doc.getElementById('science-ideas');
 if(!host)return;
 const dataURL='data/science-cabinet.json';
 const allowUrl=(raw)=>{try{const u=new URL(raw,root.location?.href||'https://moreshwarp.github.io/Moreshwar/');return u.protocol==='https:'?u.href:null}catch{return null}};
 const dayKey=(date)=>Math.floor(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())/86400000);
 const pickForDay=(items,date)=>items[(dayKey(date)%items.length+items.length)%items.length];
 let data=null,manualOffset=0,filter='All',currentKey=null;
 const el=(tag,cls,text)=>{const node=doc.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node};
 const outLink=(label,href,cls)=>{
  const a=el('a',cls,label),url=allowUrl(href);
  if(url){a.href=url;a.target='_blank';a.rel='noopener noreferrer'}
  else{a.setAttribute('aria-disabled','true');a.removeAttribute('href')}
  return a;
 };
 const get=(id)=>doc.getElementById(id);
 function showThought(date=new Date()) {
  if(!data?.thoughts?.length)return;
  const idx=(dayKey(date)+manualOffset)%data.thoughts.length;
  const row=data.thoughts[(idx+data.thoughts.length)%data.thoughts.length];
  get('idea-text').textContent=row.idea;
  get('idea-person').textContent=row.person+' / '+row.domain;
  get('idea-question').textContent=row.prompt;
  const source=get('idea-source'),url=allowUrl(row.url);
  if(url)source.href=url;else source.removeAttribute('href');
  get('idea-count').textContent=((idx+data.thoughts.length)%data.thoughts.length)+1+' / '+data.thoughts.length;
 }
 function renderPodcasts(date=new Date()){
  if(!data?.podcasts?.length)return;
  const selected=data.podcasts.filter(p=>filter==='All'||p.region===filter);
  const container=get('science-podcasts');
  container.replaceChildren();
  for(const p of selected) {
   const card=el('a','science-pod'),link=allowUrl(p.url);
   if(link){card.href=link;card.target='_blank';card.rel='noopener noreferrer'}
   const top=el('div','science-pod-top');
   top.append(el('span','science-pod-region',p.region+' / ENGLISH'),el('span','science-pod-icon','↗'));
   const title=el('strong','science-pod-title',p.title);
   const credit=el('span','science-pod-credit',p.origin);
   const reason=el('p','science-pod-why',p.why);
   const question=el('span','science-pod-question','LISTEN FOR: '+p.question);
   card.append(top,title,credit,reason,question);
   container.append(card);
  }
  const all=data.podcasts;
  const today=pickForDay(all,date);
  const link=get('daily-listen-link');
  if(link){link.textContent='Today’s listening lead: '+today.title+' ↗';const u=allowUrl(today.url);if(u)link.href=u;else link.removeAttribute('href')}
  get('podcast-count').textContent=selected.length+' verified listening leads';
  host.querySelectorAll('[data-listen-region]').forEach(button=>{
    const active=button.dataset.listenRegion===filter;
    button.setAttribute('aria-pressed',String(active));
    button.classList.toggle('active',active);
  });
 }
 function renderNobel(){
  if(!data?.nobel?.length)return;
  const target=get('science-nobel');
  target.replaceChildren();
  for(const item of data.nobel) {
   const article=el('article','nobel-portrait');
   const header=el('div','nobel-card-head');
   header.append(el('span','science-mono','2026 / '+item.field.toUpperCase()),el('span','nobel-number','↗'));
   const name=el('strong','nobel-people',item.people);
   const title=el('h3','nobel-story-title',item.heading);
   const text=el('p','nobel-story-body',item.story);
   const lesson=el('div','nobel-takeaway');
   lesson.append(el('span','science-mono','THE LESSON'),el('p','',item.lesson));
   const details=el('details','nobel-education');
   const summary=el('summary','','Education / path to discovery');
   details.append(summary,el('p','',item.education));
   const sources=el('div','nobel-sources');
   sources.append(outLink('Official Nobel announcement ↗',item.awardUrl),outLink('Education source ↗',item.educationUrl));
   article.append(header,name,title,text,lesson,details,sources);
   target.append(article);
  }
  const d=get('science-reviewed');
  if(d)d.textContent='Research checked: '+data.reviewedOn+' · Primary-source links included';
 }
 async function init(){
  try{
   const response=await root.fetch(dataURL,{cache:'no-cache'});
   if(!response.ok)throw Error('Data not available');
   const j=await response.json();
   if(!Array.isArray(j.thoughts)||!j.thoughts.length||!Array.isArray(j.podcasts)||!j.podcasts.length||!Array.isArray(j.nobel)||!j.nobel.length)throw Error('Invalid catalog');
   data=j;manualOffset=0;currentKey=dayKey(new Date());
   showThought();renderPodcasts();renderNobel();
   const status=get('science-load-status');
   if(status)status.textContent='Curated source-linked collection · English listening';
  }catch(e){
   const status=get('science-load-status');
   if(status)status.textContent='Showing the verified offline selection.';
   // Static HTML remains usable if the JSON request cannot complete.
  }
 }
 get('idea-next')?.addEventListener('click',()=>{if(!data)return;manualOffset=(manualOffset+1)%data.thoughts.length;showThought()});
 host.querySelectorAll('[data-listen-region]').forEach(button=>button.addEventListener('click',()=>{
   filter=button.dataset.listenRegion;
   if(!['All','India','USA','Global'].includes(filter))return;
   if(data)renderPodcasts();
   else {
     host.querySelectorAll('.science-pod').forEach(card=>{card.hidden=filter!=='All'&&!card.dataset.region?.includes(filter)});
     host.querySelectorAll('[data-listen-region]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.listenRegion===filter)));
   }
 }));
 if(typeof root.setInterval==='function')root.setInterval(()=>{
  const date=new Date(),key=dayKey(date);
  if(data&&currentKey!==key){currentKey=key;manualOffset=0;showThought(date);renderPodcasts(date)}
 },60000);
 init();
})(typeof window!=='undefined'?window:globalThis);
