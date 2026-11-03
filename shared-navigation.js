/* Unified academic navigation for every main research route.
 * Vanilla JS + semantic details, same markup on all pages, GitHub Pages only. */
(()=>{'use strict';
const d=document,body=d.body;
const original=d.querySelector('header.at-header, header.site-header, header.mrl-header, header.nav')||d.querySelector('main');
if(!original)return;
const onLab=/classic\.html$/i.test(location.pathname);
const icon=(path)=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';
const chevron=icon('m6 9 6 6 6-6');
const book=icon('M5 4.5c2.5-1 5-.7 7 1.5 2-2.2 4.5-2.5 7-1.5v15c-2.5-1-5-.7-7 1.5-2-2.2-4.5-2.5-7-1.5zM12 6v15');
const search=icon('M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 5 5');
const burger=icon('M4 7h16M4 12h16M4 17h16');
const arrow=icon('M7 17 17 7M8 7h9v9');
const groups=[
 {label:'Research',links:[['Systems laboratory','studio.html#systems-lab','Working demonstrations'],['Inquiry engine','studio.html#inquiry','Frame a testable question'],['Science & ideas','studio.html#science-ideas','Explore scientific concepts'],['Research studio','studio.html','Notes and experiments']]},
 {label:'Writing',links:[['All essays','reading-archive.html','Published writing'],['Featured essay','articles/183772820-the-secret-link-between-sounding.html','Evidence and persuasion'],['Latest story','index.html#academic-recent','Editorial story collection']]},
 {label:'Reading',links:[['Book catalog','index.html#bookshelf','143 searchable titles'],['Reading desk','index.html#reading-desk','What informs the lab'],['Learning notes','studio.html','Follow the research process']]},
 {label:'About',links:[['Research profile','index.html#about-profile','Focus and approach'],['Method','index.html#about','How ideas are examined'],['Contact','studio.html#contact','Reach the lab']]}
];
const item=(entry)=>'<a href="'+entry[1]+'"><span>'+entry[0]+'</span><small>'+entry[2]+'</small></a>';
const menu=groups.map((g,i)=>'<details class="mrl-nav-group"><summary>'+g.label+chevron+'</summary><div class="mrl-nav-sub" aria-label="'+g.label+' submenu">'+g.links.map(v=>item([v[0],v[1],v[2]])).join('')+'</div></details>').join('');
const header=d.createElement('header');
header.className='mrl-site-header';
header.innerHTML='<div class="mrl-site-inner"><a class="mrl-site-brand" href="index.html" aria-label="Moreshwar Research Lab home"><span class="mrl-site-monogram" aria-hidden="true">m.</span><span class="mrl-site-brandtext"><strong>Moreshwar</strong><small>Research Lab</small></span></a><nav id="mrl-site-navigation" class="mrl-site-nav" aria-label="Primary navigation"><a class="mrl-site-home" href="index.html">Home</a>'+menu+'<a class="mrl-site-single" href="studio.html">Studio</a></nav><div class="mrl-site-tools"><button class="mrl-site-search" type="button" aria-label="Search essays and books" title="Search (Ctrl+K)">'+search+'<span>Search</span></button><a class="mrl-site-action" href="reading-archive.html">Explore writing '+arrow+'</a><button class="mrl-site-mobile-toggle" type="button" aria-label="Open navigation" aria-controls="mrl-site-navigation" aria-expanded="false">'+burger+'</button></div></div>';
if(original.tagName.toLowerCase()==='main')body.insertBefore(header,body.firstChild);else original.insertAdjacentElement('beforebegin',header);
body.classList.add('mrl-nav-ready');
const themeButton=original.querySelector('#ux-theme');if(themeButton){const holder=header.querySelector('.mrl-site-tools');holder.insertBefore(themeButton,holder.querySelector('.mrl-site-mobile-toggle'));themeButton.classList.add('mrl-site-theme')}

const toggle=header.querySelector('.mrl-site-mobile-toggle'),nav=header.querySelector('.mrl-site-nav'),details=[...header.querySelectorAll('details')];
function closeMenu(){nav.classList.remove('mrl-site-nav-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation')}
function closeGroups(except){details.forEach(g=>{if(g!==except)g.open=false})}
toggle.addEventListener('click',()=>{const open=nav.classList.toggle('mrl-site-nav-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');if(!open)closeGroups()});
details.forEach(group=>{group.querySelector('summary').addEventListener('click',()=>closeGroups(group));group.addEventListener('toggle',()=>{if(group.open)closeGroups(group)})});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{closeGroups();closeMenu()}));
d.addEventListener('keydown',event=>{if(event.key==='Escape'){const hadOpen=details.some(g=>g.open)||nav.classList.contains('mrl-site-nav-open');closeGroups();closeMenu();if(hadOpen){toggle.focus();event.stopPropagation()}}});
d.addEventListener('click',event=>{if(!header.contains(event.target)){closeGroups();closeMenu()}});
header.querySelector('.mrl-site-search').addEventListener('click',()=>{const trigger=onLab?d.getElementById('search-trigger'):d.querySelector('[data-mrl-search]');if(trigger)trigger.click();else location.href='reading-archive.html'});
const file=location.pathname.split('/').pop()||'index.html';
header.querySelectorAll('a').forEach(a=>{const target=a.getAttribute('href');if(target===file||(file==='index.html'&&target==='index.html')||(file==='studio.html'&&target==='studio.html'))a.setAttribute('aria-current','page')});
})();