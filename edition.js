/* Magazine discovery: local, keyboard accessible, no tracking */
(()=>{'use strict';const section=document.getElementById('editorial-discovery');if(!section)return;
 const buttons=[...section.querySelectorAll('[data-ed-filter]')],cards=[...section.querySelectorAll('[data-ed-topic]')],status=section.querySelector('#ed-status'),surprise=section.querySelector('#ed-surprise');
 function update(topic){let n=0;for(const card of cards){const show=topic==='all'||card.dataset.edTopic.split(' ').includes(topic);card.hidden=!show;if(show)n++}for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.edFilter===topic));status.textContent=n+' paths to explore';}
 buttons.forEach(button=>button.addEventListener('click',()=>update(button.dataset.edFilter)));
 let index=0;surprise.addEventListener('click',()=>{const visible=cards.filter(c=>!c.hidden);if(!visible.length)return;const item=visible[index++%visible.length];item.focus();item.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});status.textContent='Selected: '+item.querySelector('h3').textContent;});
 update('all');
})();