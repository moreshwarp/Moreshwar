/* Moreshwar / Lab. No build step necessary; works on GitHub Pages.
   Public content loads from Supabase when configured. Otherwise visitor-safe sample
   entries render; locally added content stays on the owner's device, never public. */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const config = window.MORESHWAR_CONFIG || {};
const backendEnabled = Boolean(config.supabaseUrl && config.supabasePublishableKey);
const reducedPref = window.matchMedia('(prefers-reduced-motion: reduce)');
const safe = (str = '') => String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = str => { try {const u = new URL(str);return ['https:','http:'].includes(u.protocol) ? u.href : '';} catch {return '';} };
const friendlyDate = s => { const d = new Date(s); return Number.isFinite(d.valueOf()) ? d.toLocaleDateString('en-GB',{month:'short',year:'numeric'}) : 'Undated'; };
const slugOf = str => String(str).toLowerCase().replace(/[^a-z0-9 ]/g,'').trim().replace(/\s+/g,'-').slice(0,80);
const storageKey = 'moreshwar-lab-editor-v5';
const getLocal = () => { try { const v = JSON.parse(localStorage.getItem(storageKey)); return v && Array.isArray(v.posts) && Array.isArray(v.books) ? v : {posts:[],books:[]};}catch{return {posts:[],books:[]}} };
let local = getLocal();
function storeLocal(){try{localStorage.setItem(storageKey,JSON.stringify(local));return true}catch{alert('Unable to save in this browser. Export your content as JSON.');return false}}
const seedPosts = []; // Sample articles removed; actual published Substack archive loads below.
const seedBooks=[
 {id:'book-1',title:'Designing Data-Intensive Applications',author:'Martin Kleppmann',kind:'Book',topic:'Distributed systems',notes:'Suggested foundational reference on data models, replication and consistency.',url:'https://dataintensive.net/',published:true,seed:true},
 {id:'book-2',title:'Operating Systems: Three Easy Pieces',author:'Remzi H. Arpaci-Dusseau & Andrea C. Arpaci-Dusseau',kind:'Book',topic:'Operating systems',notes:'Suggested free learning resource for virtualization, concurrency and persistence.',url:'https://pages.cs.wisc.edu/~remzi/OSTEP/',published:true,seed:true},
 {id:'book-3',title:'The Feynman Lectures on Physics',author:'Richard Feynman, Robert Leighton & Matthew Sands',kind:'Book',topic:'Scientific reasoning',notes:'An inspiration for reasoning from physical principles and asking clearer questions.',url:'https://www.feynmanlectures.caltech.edu/',published:true,seed:true},
 {id:'book-4',title:'The Art of Computer Programming',author:'Donald E. Knuth',kind:'Book',topic:'Algorithms',notes:'Suggested deep reference on algorithms and mathematical analysis.',url:'https://www-cs-faculty.stanford.edu/~knuth/taocp.html',published:true,seed:true},
 {"id":"paper-tail","title":"The Tail at Scale","author":"Jeffrey Dean & Luiz André Barroso","kind":"Paper","topic":"Performance engineering","notes":"A foundational explanation of tail latency in large-scale services. Suggested paper, not a claimed publication.","url":"https://research.google/pubs/the-tail-at-scale/","published":true,"seed":true},
 {"id":"paper-clock","title":"Time, Clocks, and the Ordering of Events","author":"Leslie Lamport","kind":"Paper","topic":"Distributed systems","notes":"Foundational logical-clocks paper for causal reasoning about distributed events.","url":"https://www.microsoft.com/en-us/research/publication/time-clocks-ordering-events-distributed-system/","published":true,"seed":true},
 {"id":"paper-mapreduce","title":"MapReduce: Simplified Data Processing on Large Clusters","author":"Jeffrey Dean & Sanjay Ghemawat","kind":"Paper","topic":"Data processing","notes":"A classic system design for scalable batch computation. Suggested research reading.","url":"https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/","published":true,"seed":true},
 {"id":"article-failure","title":"How Complex Systems Fail","author":"Richard I. Cook","kind":"Article","topic":"Reliability","notes":"An accessible lens for thinking about failures, operational surprises, and system design.","url":"https://how.complexsystems.fail/","published":true,"seed":true},
 {"id":"article-sre","title":"Addressing Cascading Failures","author":"Google SRE","kind":"Article","topic":"Systems reliability","notes":"A practical treatment of overload, request queues, and downstream failure propagation.","url":"https://sre.google/sre-book/addressing-cascading-failures/","published":true,"seed":true},
 {"id":"course-ml","title":"MIT 6.S191: Introduction to Deep Learning","author":"MIT","kind":"Course","topic":"AI and machine learning","notes":"Public lecture materials for learning neural networks and modern deep learning concepts.","url":"https://introtodeeplearning.com/","published":true,"seed":true},
 {"id":"course-dist","title":"MIT 6.5840: Distributed Systems","author":"MIT","kind":"Course","topic":"Distributed systems","notes":"Course lectures and laboratories about replication, consistency and failure handling.","url":"https://pdos.csail.mit.edu/6.824/","published":true,"seed":true},
 {"id":"course-net","title":"Stanford CS144: Introduction to Computer Networking","author":"Stanford","kind":"Course","topic":"Networking","notes":"Public material about network architecture and implementation.","url":"https://cs144.github.io/","published":true,"seed":true}
];
// Render the verified, exported Substack archive immediately, even when JSON is cached or temporarily unavailable.
function normalizePublishedArticles(data) {
 if (!Array.isArray(data?.posts)) return [];
 return data.posts.filter(p => p && typeof p.title === 'string' && typeof p.id === 'string' && typeof p.page === 'string' && /^articles\/[a-z0-9-]+\.html$/.test(p.page)).map(p => ({
   id:p.id, title:p.title, excerpt:String(p.excerpt||''), date:String(p.date||''),
   category:'Substack', status:'published', source:'Substack', page:p.page,
   body:'', read_time:Number(p.read_time)||1
 }));
}
function embeddedPublishedArticles() {
 try {
   const el = document.getElementById('published-article-index');
   return el ? normalizePublishedArticles(JSON.parse(el.textContent)) : [];
 } catch(error) {
   console.warn('Embedded article index was not readable', error);
   return [];
 }
}
let posts = [...seedPosts], books = [...seedBooks], substackPosts = embeddedPublishedArticles(), client = null, session = null, isAdmin = false;
const visiblePosts = () => [...substackPosts, ...posts];
async function loadSubstack() {
 const status = $('#substack-sync-status');
 try {
  const response = await fetch('./substack-posts.json', {cache:'no-store'});
  if(!response.ok) throw new Error('The published article index could not be loaded.');
  const data = await response.json();
  if(!Array.isArray(data.posts)) throw new Error('Invalid published article index.');
  const verified = normalizePublishedArticles(data);
  if(verified.length) substackPosts = verified;
  if(status)status.textContent = substackPosts.length ?
   `${substackPosts.length} original published articles imported from my Substack archive. Open an article to read it here.` :
   'The published collection is currently empty.';
  renderPosts();
 }catch(error){console.warn('Live article archive temporarily unavailable; using embedded index',error);if(status)status.textContent=substackPosts.length?`${substackPosts.length} original published articles are available below.`:'The archive could not be loaded. Visit my Substack publication in the meantime.';renderPosts();}
}
const state = {articleTerm:'',articleCategory:'all',bookTerm:'',bookKind:'all',activeResearch:'systems',editorTab:'post'};
let observed = null;
function announce(el,txt,kind=''){el.textContent=txt;el.className='form-status'+(kind?' '+kind:'')}
const lineMarkup = line => safe(line).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(_,label,url)=>`<a href="${safe(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${label}</a>`);
function renderMarkdown(raw){
 const lines=String(raw||'').replace(/\r\n/g,'\n').split('\n'); let html='',inList='',inCode=false,code=[];
 const closeList=()=>{if(inList){html+=`</${inList}>`;inList=''}};
 for(const line of lines){
  if(line.trim().startsWith('```')){if(inCode){html+=`<pre><code>${safe(code.join('\n'))}</code></pre>`;code=[];inCode=false}else{closeList();inCode=true}continue}
  if(inCode){code.push(line);continue}const trimmed=line.trim();
  if(!trimmed){closeList();continue}
  if(/^#{1,3} /.test(trimmed)){closeList();let n=trimmed.match(/^#+/)[0].length;html+=`<h${Math.min(3,n+1)}>${lineMarkup(trimmed.slice(n+1))}</h${Math.min(3,n+1)}>`;continue}
  if(/^---+$/.test(trimmed)){closeList();html+='<hr />';continue}
  if(/^>\s?/.test(trimmed)){closeList();html+=`<blockquote>${lineMarkup(trimmed.replace(/^>\s?/,''))}</blockquote>`;continue}
  const ordered=/^\d+\. /.test(trimmed),bulleted=/^[-*] /.test(trimmed);
  if(ordered||bulleted){const tag=ordered?'ol':'ul';if(inList!==tag){closeList();html+=`<${tag}>`;inList=tag}html+=`<li>${lineMarkup(trimmed.replace(ordered?/^\d+\. /:/^[-*] /,''))}</li>`;continue}
  closeList();html+=`<p>${lineMarkup(trimmed)}</p>`;
 }closeList();if(inCode)html+=`<pre><code>${safe(code.join('\n'))}</code></pre>`;return html;
}
function allForEditor(type){const live=type==='post'?posts:books;const drafts=type==='post'?local.posts:local.books;return [...live.filter(x=>!drafts.some(y=>y.id===x.id)),...drafts]}
function renderPosts(){
 const selected=visiblePosts().filter(x=>x.status==='published'&&(!state.articleTerm||`${x.title} ${x.excerpt} ${x.category}`.toLowerCase().includes(state.articleTerm))&&(state.articleCategory==='all'||x.category===state.articleCategory)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 $('#article-list').innerHTML=selected.map(a=>`<button class="article-row" type="button" data-read="${safe(a.id)}"><span class="article-date">${safe(friendlyDate(a.date))}</span><span class="article-main"><h3>${safe(a.title)}</h3><p>${safe(a.excerpt)}</p></span><span class="article-category">${safe(a.category)} · ${a.source==='Substack'?'READ ARTICLE':String(a.id).startsWith('seed-')?'SAMPLE NOTE':(Number(a.read_time)||Math.max(1,Math.ceil(String(a.body||'').split(/\s+/).length/210)))+' MIN'}</span><span class="article-north">↗</span></button>`).join('');
 $('#article-count').textContent=`${String(selected.length).padStart(2,'0')} ENTR${selected.length===1?'Y':'IES'}`;$('#article-empty').hidden=selected.length>0;
}
function renderBooks(){
 const shown=books.filter(b=>b.published!==false&&(!state.bookTerm||`${b.title} ${b.author} ${b.topic} ${b.notes}`.toLowerCase().includes(state.bookTerm))&&(state.bookKind==='all'||b.kind===state.bookKind));
 $('#book-grid').innerHTML=shown.length?shown.map((b,i)=>`<article class="book-card"><div class="book-cover" style="--book-shade:${['#24475b','#4a496e','#3b5556','#4e414e','#3d5862'][i%5]}"><span class="book-glyph">${safe(String(b.title||'?').charAt(0))}</span></div><span class="mono">${safe(b.kind.toUpperCase())} / ${safe(b.topic||'REFERENCE')}</span><h3>${safe(b.title)}</h3><p>${safe(b.author||'Author to add')}</p><p class="book-notes">${safe(b.notes||'Notes to be added.')}</p>${safeUrl(b.url)?`<a href="${safe(safeUrl(b.url))}" target="_blank" rel="noopener noreferrer">OPEN REFERENCE ↗</a>`:''}</article>`).join(''):
  `<section class="library-empty-panel"><div class="empty-copy"><span class="mono">CURATION / SEARCH RESULTS</span><h3>Nothing on this shelf yet.</h3><p>Your search or filter returned no references. Try a different question or return to the full collection of reading suggestions.</p><button type="button" data-library-reset="true">Explore all references ↗</button></div><div class="library-empty-visual" aria-hidden="true"><div><b>01</b><span>QUESTION / FORMULATED</span></div><div><b>02</b><span>SEARCH / CONTINUING</span></div><div><b>03</b><span>REFERENCE / NEXT</span></div></div></section>`;
 const count=document.getElementById('library-count');
 if(count)count.textContent=shown.length+' / '+books.filter(b=>b.published!==false).length+' SUGGESTED REFERENCES';
}
$('#book-grid').addEventListener('click',e=>{
 const button=e.target.closest('[data-library-reset]');
 if(!button)return;
 state.bookKind='all';state.bookTerm='';
 $('#library-search').value='';
 $$('[data-book-filter]').forEach(b=>{const selected=b.dataset.bookFilter==='all';b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
 renderBooks();
});
function showModal(id){const el=$('#'+id);if(!el.open){el.showModal();document.body.classList.add('modal-open')}}
function closeModal(id){const el=$('#'+id);if(el.open)el.close();document.body.classList.remove('modal-open')}
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
$$('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d)d.close()});d.addEventListener('close',()=>document.body.classList.remove('modal-open'))});
function openArticle(id){const a=visiblePosts().find(x=>x.id===id);if(!a)return;if(a.source==='Substack'){if(a.page&&/^articles\/[a-z0-9-]+\.html$/.test(a.page)){location.assign(new URL(a.page,document.baseURI).href);return;}const u=safeUrl(a.url);if(u)window.open(u,'_blank','noopener,noreferrer');return;}$('#reader-eyebrow').textContent='THE NOTEBOOK / '+String(a.category).toUpperCase();$('#reader-content').innerHTML=`<h1 id="reader-title">${safe(a.title)}</h1><div class="reader-meta"><span>${safe(friendlyDate(a.date))}</span><span>${safe(a.category)}</span><span>${Number(a.read_time)||Math.max(1,Math.ceil(a.body.split(/\s+/).length/210))} MIN READ</span></div><p class="reader-lede">${safe(a.excerpt)}</p><div class="article-body">${renderMarkdown(a.body)}</div>${safeUrl(a.url)?`<p><a class="text-link" href="${safe(safeUrl(a.url))}" target="_blank" rel="noopener noreferrer">Additional reference ↗</a></p>`:''}<p><a class="text-link" href="#contact" data-feedback="${safe(a.title)}">Send a comment on this article ↗</a></p>`;showModal('reader-dialog');const f=$('[data-feedback]',$('#reader-content'));f?.addEventListener('click',()=>{closeModal('reader-dialog');$('#contact-topic').value='Article feedback';$('#contact-message').value='Regarding: '+a.title+'\n\n';$('#contact-message').focus()});}
$('#article-list').addEventListener('click',e=>{const b=e.target.closest('[data-read]');if(b)openArticle(b.dataset.read)});
const projectData={
  "frontend":{label:"FRONTEND ENGINEERING · ENGINEERING PRACTICE",title:"Frontend engineering, beyond pixels",excerpt:"Angular, TypeScript, and editor integrations force precision about what the browser is actually doing.",body:`## Where I have explored engineering problems

Rich-text editing is a good example of a deceptively complex feature: what looks like formatting involves the DOM, CSS, state synchronization, browser behavior and content safety. I have examined Angular and Froala integration questions, link styling, rendered HTML and sanitization decisions.

## Questions that matter

- When should a UI preserve editor-generated structure, and when should it transform it?
- How do we avoid browser-dependent rendering surprises?
- Can formatting policies be tested as rules rather than treated as visual accidents?
- What should happen when content crosses trust boundaries?

## Why this matters

Frontend work becomes interesting when you stop treating the browser like a paint surface and start treating it like a living system.`},
  "machine-learning":{label:"AI / MACHINE LEARNING · ACTIVE STUDY",title:"AI & machine learning, from first principles",excerpt:"A learning and research direction focused on understanding models, data, and evaluation rather than merely calling an API.",body:`## What I want from AI/ML

I am interested in the logic underneath machine learning: how data shapes models, how evaluation should be designed, and how infrastructure affects results.

## Current path

1. Strengthen linear algebra, probability, statistics and optimization.
2. Implement baselines in Python.
3. Understand model training, inference and failure analysis.
4. Move from toy notebooks toward reproducible systems.

## Why it fits my profile

This connects my software-engineering side with a more scientific mode of thinking: hypothesis, measurement, iteration, and explanation.`},
  "react":{label:"REACT & UI ARCHITECTURE · TECHNICAL FOCUS",title:"React, component architecture & UX",excerpt:"The hard part is not rendering a component; it is managing change across the system.",body:`## Questions behind a good component architecture

- Where should state live, and what is truly derived state?
- How do contracts between components limit coupling?
- How can navigation, data loading, and errors stay accessible and predictable?
- What happens on slow phones, intermittent networks, or assistive technologies?

## How I think about it

A useful interface is not just beautiful. It has clear boundaries, graceful failure states, measurable performance, and a structure that can evolve without becoming fragile.`},
  "backend":{label:"BACKEND & API DESIGN · EXPLORATION",title:"Backend services & API design",excerpt:"The contract between a browser and a service deserves the same care as the interface itself.",body:`## What I am exploring

Backend systems interest me because they reveal how products really behave under load, failure, concurrency and changing data.

## Themes

- **Go:** concurrency, services, predictable behavior.
- **Node.js:** asynchronous I/O, middleware, validation.
- **SQL:** data models, indexes, transactional reasoning.
- **APIs:** contracts, idempotency, observability.

## The engineering mindset

A service is not merely an endpoint. It is a promise about correctness, latency, failure handling and maintainability.`},
  "sanitization":{label:"APPLICATION SECURITY · ENGINEERING CASE",title:"Secure rendering & HTML semantics",excerpt:"Display fidelity is valuable, but it never justifies elevating untrusted HTML to trusted content.",body:`## The trust boundary

Rich-text content can carry markup, styles and URLs. If that markup reaches a browser unvalidated, apparently harmless rendering decisions can become security vulnerabilities.

## Questions worth testing

- Which tags, attributes, CSS declarations and URL protocols are actually needed?
- How should sanitization be applied without blanket trust bypasses?
- What should happen to unsafe links, nested editor markup and pasted content?
- Can transformations remain testable and explainable?

## Why this is a favorite topic

It sits at the intersection of product needs, user experience, and security engineering.`},
  "systems":{label:"OPERATING / DISTRIBUTED SYSTEMS · RESEARCH DIRECTION",title:"Operating systems & distributed computing",excerpt:"The deeper question: what makes software correct and reliable when resources and machines can fail?",body:`## Questions that motivate me

How do scheduling and contention shape observed performance? What does consistency mean when messages are delayed? Which guarantees survive crashes and retries?

## Foundations I want to master

- **Operating systems:** processes, virtual memory, scheduling and filesystems.
- **Distributed systems:** replication, coordination, failure models and recovery.
- **Systems programming:** C, C++, Linux and low-level reasoning.

## Why it belongs here

Systems thinking is where engineering becomes scientific: define the mechanism, test the assumptions, and observe the consequences.`}
};
const workFilterButtons = $$('[data-work-filter]');
const workCards = $$('[data-work-track]');
function setWorkFilter(track) {
 const allowed = new Set(['all','frontend','ai','backend','systems']);
 if (!allowed.has(track)) track = 'all';
 let shown = 0;
 workCards.forEach(card => {
   const visible = track === 'all' || card.dataset.workTrack === track;
   card.hidden = !visible;
   if (visible) shown++;
 });
 workFilterButtons.forEach(button => {
   const active = button.dataset.workFilter === track;
   button.classList.toggle('active', active);
   button.setAttribute('aria-pressed', String(active));
 });
 const label = {all:'ALL DOMAINS',frontend:'FRONTEND',ai:'AI / ML',backend:'BACKEND',systems:'SYSTEMS'}[track];
 const result = $('#work-results');
 if (result) result.innerHTML = 'SHOWING ' + String(shown).padStart(2,'0') + ' / ' + label + ' <span>· SELECT A CARD TO EXPLORE</span>';
}
function openProjectLike(item){
 if (!item) return;
 $('#project-content').innerHTML = '<span class="modal-track-label mono">'+safe(item.label || 'TECHNICAL NOTE')+'</span>'+
   '<h1 id="project-title">'+safe(item.title)+'</h1>'+
   '<p class="reader-lede">'+safe(item.excerpt)+'</p>'+
   '<div class="article-body">'+renderMarkdown(item.body)+'</div>';
 showModal('project-dialog');
}
workFilterButtons.forEach(button => button.addEventListener('click', () => setWorkFilter(button.dataset.workFilter)));
$$('[data-project]').forEach(button => button.addEventListener('click', () => openProjectLike(projectData[button.dataset.project])));

setWorkFilter('all');
const research={systems:{index:'R / 00 — CENTRAL QUESTION',title:'How do complex systems remain understandable?',text:'The intersection of abstractions, implementation, failures, and observable behavior. I want to understand systems by studying their mechanisms and testing their assumptions.',tags:['Reliability','Correctness','Performance']},os:{index:'R / 01 — OPERATING SYSTEMS',title:'What really happens when programs compete for resources?',text:'Scheduling, virtual memory, isolation, concurrency, synchronization, and the runtime behavior underlying every application.',tags:['Scheduling','Concurrency','Memory']},distributed:{index:'R / 02 — DISTRIBUTED SYSTEMS',title:'What can we promise when machines can fail?',text:'Coordination, fault tolerance, consistency models, replication, recovery, and the boundaries of what a networked system can guarantee.',tags:['Consistency','Replication','Faults']},compilers:{index:'R / 03 — COMPILERS',title:'How do abstractions become machine behavior?',text:'Language implementation, code generation, optimization, and the trade-offs made between expressiveness, correctness, and speed.',tags:['Optimization','Semantics','Runtimes']},ml:{index:'R / 04 — ML SYSTEMS',title:'What does it take to make learning systems efficient and reliable?',text:'Understanding machine learning from mathematics and implementation, with an interest in training infrastructure, inference, evaluation and systems performance.',tags:['Python','ML','Inference']}};
function selectResearch(k){const r=research[k];if(!r)return;state.activeResearch=k;$('#research-index').textContent=r.index;$('#research-heading').textContent=r.title;$('#research-description').textContent=r.text;$('#research-keywords').innerHTML=r.tags.map(x=>`<span>${safe(x)}</span>`).join('');$('.research-progress span').style.width=({systems:64,os:35,distributed:48,compilers:62,ml:80}[k])+'%';$$('.rnode').forEach(n=>n.classList.toggle('active',n.dataset.r===k))}
$$('.rnode').forEach(node=>{node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label','Explore '+node.dataset.r+' research');node.addEventListener('click',()=>selectResearch(node.dataset.r));node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectResearch(node.dataset.r)}})});selectResearch('systems');
$('#article-search').addEventListener('input',e=>{state.articleTerm=e.target.value.trim().toLowerCase();renderPosts()});$('#article-filter').addEventListener('change',e=>{state.articleCategory=e.target.value;renderPosts()});
$('#library-search').addEventListener('input',e=>{state.bookTerm=e.target.value.trim().toLowerCase();renderBooks()});$$('[data-book-filter]').forEach(b=>b.addEventListener('click',()=>{state.bookKind=b.dataset.bookFilter;$$('[data-book-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});renderBooks()}));
function searchRecords(term){const q=term.toLowerCase().trim();const sections=[{title:'Work',href:'#work'},{title:'Research',href:'#research'},{title:'Writing',href:'#writing'},{title:'Library',href:'#library'},{title:'About',href:'#about'},{title:'Contact',href:'#contact'}].filter(x=>x.title.toLowerCase().includes(q)).map(x=>({...x,type:'PAGE'}));const foundPosts=visiblePosts().filter(x=>x.status==='published'&&`${x.title} ${x.excerpt}`.toLowerCase().includes(q)).map(x=>({title:x.title,id:x.id,type:'ARTICLE'}));const foundBooks=books.filter(x=>x.published!==false&&`${x.title} ${x.author}`.toLowerCase().includes(q)).map(x=>({...x,type:'REFERENCE'}));return [...sections,...foundPosts,...foundBooks].slice(0,12)}
function renderGlobal(q=''){const entries=searchRecords(q);$('#global-results').innerHTML=entries.map((x,i)=>`<button type="button" class="global-entry" data-result="${i}"><small>${x.type}</small>${safe(x.title)}</button>`).join('')||'<div class="global-empty">No results found.</div>';$('#global-results')._entries=entries}
$('#search-trigger').addEventListener('click',()=>{renderGlobal();showModal('search-dialog');$('#global-search').focus()});$('#global-search').addEventListener('input',e=>renderGlobal(e.target.value));$('#global-results').addEventListener('click',e=>{const b=e.target.closest('[data-result]');if(!b)return;const x=$('#global-results')._entries[+b.dataset.result];closeModal('search-dialog');if(x.type==='ARTICLE')openArticle(x.id);else if(x.type==='PAGE')location.hash=x.href;else{location.hash='#library';$('#library-search').value=x.title;state.bookTerm=x.title.toLowerCase();renderBooks()}});
window.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();renderGlobal();showModal('search-dialog');$('#global-search').focus()}if(e.key==='Escape'&&$('#mobile-menu').hidden===false){$('#mobile-menu').hidden=true;$('#menu-trigger').setAttribute('aria-expanded','false')}});
$('#menu-trigger').addEventListener('click',()=>{const m=$('#mobile-menu');m.hidden=!m.hidden;$('#menu-trigger').setAttribute('aria-expanded',String(!m.hidden))});$$('#mobile-menu a').forEach(a=>a.addEventListener('click',()=>{$('#mobile-menu').hidden=true;$('#menu-trigger').setAttribute('aria-expanded','false')}));
$('#year').textContent=new Date().getFullYear();const motionDisabled=()=>reducedPref.matches||document.body.classList.contains('reduce-motion');
$('#motion-toggle').addEventListener('click',()=>{document.body.classList.toggle('reduce-motion');const active=document.body.classList.contains('reduce-motion');$('#motion-toggle').setAttribute('aria-pressed',String(active));$('#motion-toggle').textContent=active?'Enable motion ◎':'Reduce motion ◌';if(window._stopThree)window._stopThree(active)});
function onScroll(){const y=document.documentElement.scrollTop,max=document.documentElement.scrollHeight-innerHeight;$('#scroll-progress').style.width=(max>0?100*y/max:0)+'%'}window.addEventListener('scroll',onScroll,{passive:true});onScroll();
if('IntersectionObserver' in window){observed=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observed.unobserve(e.target)}}),{threshold:.08});$$('.reveal').forEach(el=>observed.observe(el))}else $$('.reveal').forEach(el=>el.classList.add('visible'));
// The hero's scientific SVG is built into the page and renders with no WebGL or third-party downloads.
// Supabase: PUBLIC read, single approved admin write, no secrets in the browser.
// Public site: content and appearance are read-only; authenticated publishing lives in GitHub Pages CMS.
renderPosts();
renderBooks();
loadSubstack();
