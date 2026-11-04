/* Unified academic navigation for every main research route.
 * Vanilla JS + semantic details, same markup on all pages, GitHub Pages only. */
(()=>{'use strict';
const d=document,body=d.body;
const original=d.querySelector('header.at-header, header.site-header, header.mrl-header, header.nav')||d.querySelector('main');
if(!original)return;
const onLab=false;
const icon=(path)=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';
const chevron=icon('m6 9 6 6 6-6');
const search=icon('M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 5 5');
const burger=icon('M4 7h16M4 12h16M4 17h16');
const arrow=icon('M7 17 17 7M8 7h9v9');
const menu='<a href="index.html">Home</a><a href="studio.html">Research</a><a href="reading-archive.html">Writing</a><a href="index.html#about-profile">About</a>';
const header=d.createElement('header');
header.className='mrl-site-header';
header.innerHTML='<div class="mrl-site-inner"><a class="mrl-site-brand" href="index.html" aria-label="Moreshwar Systems Lab home"><span class="mrl-site-monogram" aria-hidden="true">m.</span><span class="mrl-site-brandtext"><strong>Moreshwar</strong><small>Systems Lab</small></span></a><nav id="mrl-site-navigation" class="mrl-site-nav" aria-label="Primary navigation">'+menu+'</nav><div class="mrl-site-tools"><button class="mrl-site-search" type="button" aria-label="Search essays and research" title="Search essays (Ctrl+K)">'+search+'<span>Search</span></button><a class="mrl-site-action" href="reading-archive.html">Explore writing '+arrow+'</a><button class="mrl-site-mobile-toggle" type="button" aria-label="Open navigation" aria-controls="mrl-site-navigation" aria-expanded="false">'+burger+'</button></div></div>';
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