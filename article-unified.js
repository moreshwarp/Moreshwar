/* Uniform navigation for all published essays and fieldnotes.
 * No personal data or external resources. */
(()=>{'use strict';const d=document,b=d.body;
if(!b||!d.querySelector('main'))return;
b.classList.add('sch-reader');
const main=d.querySelector('main');if(!main.id)main.id='sch-article-content';
const header=d.createElement('header');header.className='sch-reader-header';header.innerHTML=
 '<div class="sch-reader-top"><a class="sch-reader-brand" href="../index.html">Moreshwar<small>Research Lab</small></a><a class="sch-reader-source" href="../reading-archive.html">All writing ↗</a></div>'+
 '<nav class="sch-reader-nav" aria-label="Site navigation"><div class="sch-reader-nav-inner">'+
 '<button class="sch-reader-mobile-toggle" type="button" aria-expanded="false" aria-controls="sch-reader-menu">Browse site <span aria-hidden="true">☰</span></button>'+
 '<div class="sch-reader-menu" id="sch-reader-menu"><a href="../index.html">Home</a>'+
 '<details><summary>Research <span aria-hidden="true">⌄</span></summary><div class="sch-reader-sub"><a href="../studio.html#systems-lab">Systems laboratory</a><a href="../studio.html#inquiry">Inquiry engine</a><a href="../studio.html">Research studio</a></div></details>'+
 '<details><summary>Writing <span aria-hidden="true">⌄</span></summary><div class="sch-reader-sub"><a href="../reading-archive.html">All essays</a><a href="../articles/fieldnote-queues.html">Systems fieldnotes</a></div></details>'+
 '<a href="../index.html#bookshelf">Books</a><a href="../studio.html">Studio</a><a href="../studio.html#contact">Contact</a></div></div></nav>';
const previous=d.querySelector('.site-nav,header.top.shell');if(previous){const shell=previous.closest('.shell');if(previous.matches('.site-nav')&&shell&&shell.children.length===1)shell.remove();else previous.remove()}
b.insertBefore(header,b.firstChild);
const skip=d.createElement('a');skip.className='sch-reader-skip';skip.href='#'+main.id;skip.textContent='Skip to article';b.insertBefore(skip,header);
const menu=header.querySelector('.sch-reader-menu'),toggle=header.querySelector('.sch-reader-mobile-toggle'),groups=[...header.querySelectorAll('details')];
function close(){groups.forEach(group=>group.open=false);menu.classList.remove('is-open');toggle.setAttribute('aria-expanded','false')}
toggle.addEventListener('click',()=>{const open=menu.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));if(!open)groups.forEach(g=>g.open=false)});
groups.forEach(group=>{group.querySelector('summary').addEventListener('click',()=>groups.forEach(other=>{if(other!==group)other.open=false}))});
d.addEventListener('keydown',e=>{if(e.key==='Escape'){const wasOpen=menu.classList.contains('is-open')||groups.some(x=>x.open);close();if(wasOpen)toggle.focus()}});
d.addEventListener('click',e=>{if(!header.contains(e.target))close()});
const footer=d.createElement('footer');footer.className='sch-reader-footer';footer.innerHTML='<div class="sch-reader-footer-inner"><strong>Moreshwar Research Lab</strong><p>Independent writing, research and reading. Claims in these essays are not presented as peer-reviewed results.</p><a href="../reading-archive.html">Essay archive</a><a href="../studio.html#systems-lab">Systems research</a><a href="../index.html#bookshelf">Reading shelf</a><a href="../index.html">Homepage</a></div>';b.append(footer);
})();