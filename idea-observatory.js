/* Original, keyboard-operable idea map. No telemetry and no network requests. */
(()=>{'use strict';const root=document.querySelector('[data-observatory]');if(!root)return;
const nodes=[...root.querySelectorAll('[data-idea]')],title=root.querySelector('#obs-title'),body=root.querySelector('#obs-description'),kicker=root.querySelector('#obs-kicker'),link=root.querySelector('#obs-link');
const ideas={
systems:{title:'Distributed systems',desc:'How can independent machines behave like one reliable system? Study failures, coordination and real trade-offs.',href:'studio.html#systems-lab',label:'Open systems lab'},
proof:{title:'Proof and trust',desc:'What can we prove without revealing the information itself? Explore zero-knowledge ideas through a published introduction.',href:'articles/165015685-zero-knowledge-proof-zkp-the-magic-of-proving-without-revealing-9e41181e918e.html',label:'Read the essay'},
books:{title:'The reading shelf',desc:'Search 143 cataloged titles across computer science, psychology, mathematics and literature.',href:'index.html#bookshelf',label:'Browse books'},
ideas:{title:'Original essays',desc:'Explore 22 published essays, from critical thinking to research and the hidden structure of technology.',href:'reading-archive.html',label:'Explore essays'},
research:{title:'Research studio',desc:'Move from an interesting claim to a testable question. Explore notes, tools and a practice of careful inquiry.',href:'studio.html',label:'Enter studio'}};
function select(id){const item=ideas[id];if(!item)return;for(const node of nodes)node.setAttribute('aria-pressed',String(node.dataset.idea===id));title.textContent=item.title;body.textContent=item.desc;kicker.textContent='SELECTED / '+id.toUpperCase();link.href=item.href;link.textContent=item.label+' ↗'}
nodes.forEach(node=>{node.addEventListener('click',()=>select(node.dataset.idea));node.addEventListener('keydown',e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();const i=nodes.indexOf(node),next=nodes[(i+(e.key==='ArrowRight'?1:-1)+nodes.length)%nodes.length];next.focus();select(next.dataset.idea)})});select('systems');
})();