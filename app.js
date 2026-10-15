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
async function initBackend(){if(!backendEnabled){$('#admin-state').textContent='Local preview mode: you can draft entries and export them. To publish to all visitors, configure Supabase and its database policies.';return}
 try{const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.58.0');client=createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{detectSessionInUrl:true,persistSession:true}});const {data:{session:s}}=await client.auth.getSession();session=s;await loadPublished();await refreshAdmin();client.auth.onAuthStateChange((_ev,newSession)=>{session=newSession;setTimeout(()=>refreshAdmin(),0)})}catch(err){console.error('Backend unavailable',err);$('#admin-state').textContent='Cannot reach publishing service; local draft mode is available.'}
}
async function loadPublished(){if(!client)return;try{const [p,b]=await Promise.all([client.from('posts').select('id,title,category,excerpt,body,status,date,read_time,url').eq('status','published').order('date',{ascending:false}),client.from('references').select('id,title,author,kind,topic,notes,url,published').eq('published',true).order('created_at',{ascending:false})]);if(p.error)throw p.error;if(b.error)throw b.error;posts=p.data;books=b.data;renderPosts();renderBooks()}catch(err){console.error(err);announce($('#auth-status'),'Public content could not be loaded; showing sample entries.','error')}}
async function refreshAdmin(){isAdmin=false;if(client&&session?.user){const {data,error}=await client.from('admins').select('user_id').eq('user_id',session.user.id).maybeSingle();isAdmin=Boolean(data&&!error)}$('#admin-logout').hidden=!session;$('#admin-login').hidden=!!session;$('#admin-email').disabled=!!session;$('#admin-state').textContent=isAdmin?'Signed in as the site editor. Published entries appear publicly; drafts remain private.':(session?'Signed in, but this account is not authorized to publish. Add its user ID to the admins table.':backendEnabled?'Sign in using the authorized admin account. Only approved accounts can write to the database.':'Local preview mode: you can draft entries and export them. Add Supabase to publish publicly.');if(isAdmin)await loadAdminRecords();else if(client)await loadPublished();renderAdminEntries()}
async function loadAdminRecords(){if(!client||!isAdmin)return;const [p,b]=await Promise.all([client.from('posts').select('*').order('date',{ascending:false}),client.from('references').select('*').order('created_at',{ascending:false})]);if(!p.error)posts=p.data;if(!b.error)books=b.data;renderPosts();renderBooks()}
$('#admin-entry').addEventListener('click',()=>{renderAdminEntries();showModal('admin-dialog')});$('#admin-login').addEventListener('click',async()=>{if(!client)return announce($('#auth-status'),'Configure Supabase first. Local drafting remains available.','error');const email=$('#admin-email').value.trim();if(!/^\S+@\S+\.\S+$/.test(email))return announce($('#auth-status'),'Enter a valid email address.','error');const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});announce($('#auth-status'),error?error.message:'Sign-in link requested. Check your inbox.',error?'error':'success')});$('#admin-logout').addEventListener('click',async()=>{if(client)await client.auth.signOut();session=null;await refreshAdmin()});
$$('[data-editor-tab]').forEach(b=>b.addEventListener('click',()=>{state.editorTab=b.dataset.editorTab;$$('[data-editor-tab]').forEach(x=>x.classList.toggle('active',x===b));$('#post-editor').hidden=state.editorTab!=='post';$('#book-editor').hidden=state.editorTab!=='book';$('#backup-panel').hidden=state.editorTab!=='export';renderAdminEntries()}));
function renderAdminEntries(){const type=state.editorTab==='book'?'book':'post';if(state.editorTab==='export'){$('#admin-entries').innerHTML='';return}const own=isAdmin?(type==='post'?posts:books):(type==='post'?local.posts:local.books);$('#admin-entries').innerHTML=own.slice().reverse().map(x=>`<div class="admin-entry"><div><strong>${safe(x.title)}</strong><small>${safe(type==='post'?x.status:(x.published?'Public':'Private'))}${String(x.id).startsWith('seed-')?' · sample':''}</small></div><div><button type="button" data-edit-id="${safe(x.id)}" data-edit-type="${type}">Edit</button> <button type="button" class="delete-entry" data-delete-id="${safe(x.id)}" data-delete-type="${type}">Delete</button></div></div>`).join('')||'<p class="form-status">No editable entries yet.</p>'}
$('#admin-entries').addEventListener('click',async e=>{const edit=e.target.closest('[data-edit-id]');const del=e.target.closest('[data-delete-id]');if(edit){const data=(edit.dataset.editType==='post'?posts:books).find(x=>x.id===edit.dataset.editId)||(edit.dataset.editType==='post'?local.posts:local.books).find(x=>x.id===edit.dataset.editId);if(!data)return;if(edit.dataset.editType==='post'){state.editorTab='post';$$('[data-editor-tab]').find(x=>x.dataset.editorTab==='post').click();$('#edit-post-id').value=data.id;$('#edit-post-title').value=data.title;$('#edit-post-category').value=data.category;$('#edit-post-status').value=data.status;$('#edit-post-excerpt').value=data.excerpt;$('#edit-post-body').value=data.body;$('#edit-post-url').value=data.url||''}else{state.editorTab='book';$$('[data-editor-tab]').find(x=>x.dataset.editorTab==='book').click();$('#edit-book-id').value=data.id;$('#edit-book-title').value=data.title;$('#edit-book-author').value=data.author||'';$('#edit-book-kind').value=data.kind;$('#edit-book-topic').value=data.topic||'';$('#edit-book-url').value=data.url||'';$('#edit-book-notes').value=data.notes||'';$('#edit-book-published').checked=data.published!==false}$('.admin-body').scrollTop=0}
 if(del){if(!confirm('Delete this entry?'))return;const isPost=del.dataset.deleteType==='post';if(isAdmin&&client){const {error}=await client.from(isPost?'posts':'references').delete().eq('id',del.dataset.deleteId);if(error){alert(error.message);return}await loadAdminRecords()}else{const arr=isPost?'posts':'books';local[arr]=local[arr].filter(x=>x.id!==del.dataset.deleteId);storeLocal();if(isPost)posts=[...seedPosts,...local.posts.filter(x=>x.status==='published')];else books=[...seedBooks,...local.books.filter(x=>x.published)];renderPosts();renderBooks()}renderAdminEntries()}});
$('#new-entry').addEventListener('click',()=>{if(state.editorTab==='book'){$('#book-editor').reset();$('#edit-book-id').value=''}else{$('#post-editor').reset();$('#edit-post-id').value=''}announce($('#post-editor-status'),'');announce($('#book-editor-status'),'')});
$('#post-editor').addEventListener('submit',async e=>{e.preventDefault();const doc={title:$('#edit-post-title').value.trim(),category:$('#edit-post-category').value,excerpt:$('#edit-post-excerpt').value.trim(),body:$('#edit-post-body').value.trim(),status:$('#edit-post-status').value,url:safeUrl($('#edit-post-url').value.trim())||null,date:new Date().toISOString().slice(0,10),read_time:Math.max(1,Math.ceil($('#edit-post-body').value.split(/\s+/).length/210))};const id=$('#edit-post-id').value;if(!doc.title||!doc.body||!doc.excerpt)return announce($('#post-editor-status'),'Please complete the required fields.','error');
 if(isAdmin&&client){if(id&&!String(id).startsWith('seed-'))doc.id=id;const {error}=await client.from('posts').upsert(doc,{onConflict:'id'});if(error)return announce($('#post-editor-status'),error.message,'error');await loadAdminRecords();announce($('#post-editor-status'),doc.status==='published'?'Published successfully.':'Private draft saved.','success')}else{const next={...doc,id:id||crypto.randomUUID()};local.posts=local.posts.filter(x=>x.id!==next.id);local.posts.push(next);storeLocal();posts=[...seedPosts,...local.posts.filter(x=>x.status==='published')];renderPosts();announce($('#post-editor-status'),'Saved on this device only; not published online.','success')}renderAdminEntries();$('#edit-post-id').value=''});
$('#book-editor').addEventListener('submit',async e=>{e.preventDefault();const doc={title:$('#edit-book-title').value.trim(),author:$('#edit-book-author').value.trim(),kind:$('#edit-book-kind').value,topic:$('#edit-book-topic').value.trim(),url:safeUrl($('#edit-book-url').value.trim())||null,notes:$('#edit-book-notes').value.trim(),published:$('#edit-book-published').checked};const id=$('#edit-book-id').value;if(!doc.title)return announce($('#book-editor-status'),'Add a title.','error');if(isAdmin&&client){if(id&&!String(id).startsWith('book-'))doc.id=id;const {error}=await client.from('references').upsert(doc,{onConflict:'id'});if(error)return announce($('#book-editor-status'),error.message,'error');await loadAdminRecords();announce($('#book-editor-status'),'Reference saved.','success')}else{const next={...doc,id:id||crypto.randomUUID()};local.books=local.books.filter(x=>x.id!==next.id);local.books.push(next);storeLocal();books=[...seedBooks,...local.books.filter(x=>x.published)];renderBooks();announce($('#book-editor-status'),'Reference saved on this device only.','success')}renderAdminEntries();$('#edit-book-id').value=''});
$('#export-local').addEventListener('click',()=>{const payload={version:5,exported:new Date().toISOString(),posts:isAdmin?posts:local.posts,books:isAdmin?books:local.books};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='moreshwar-editor-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce($('#backup-status'),'Backup exported.','success')});
$('#import-local').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>1024*1024)throw Error('File too large (1 MB maximum).');const data=JSON.parse(await f.text());if(!Array.isArray(data.posts)||!Array.isArray(data.books))throw Error('Unsupported backup format.');local={posts:data.posts.filter(x=>x&&typeof x.title==='string'&&typeof x.body==='string').slice(0,200).map(x=>({...x,id:crypto.randomUUID()})),books:data.books.filter(x=>x&&typeof x.title==='string').slice(0,300).map(x=>({...x,id:crypto.randomUUID()}))};storeLocal();if(!isAdmin){posts=[...seedPosts,...local.posts.filter(x=>x.status==='published')];books=[...seedBooks,...local.books.filter(x=>x.published)];renderPosts();renderBooks()}announce($('#backup-status'),'Imported as local drafts. Review entries before publishing.','success')}catch(err){announce($('#backup-status'),err.message,'error')}});
// Contact mail is submitted to FormSubmit from this static GitHub Pages site.
// The mailbox owner must confirm FormSubmit's first activation email before delivery is enabled.
// Until that happens, never claim a message reached the inbox.

renderPosts();renderBooks();loadSubstack();initBackend();