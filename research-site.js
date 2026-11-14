(()=>{'use strict';const root=document.documentElement,button=document.getElementById('theme-toggle');if(!button)return;const key='mrl-research-theme';let selected='light';try{const stored=localStorage.getItem(key);if(stored==='light'||stored==='dark')selected=stored}catch{}function apply(){root.dataset.theme=selected;button.textContent=selected==='dark'?'Light mode':'Dark mode';button.setAttribute('aria-label',selected==='dark'?'Switch to light theme':'Switch to dark theme');button.setAttribute('aria-pressed',String(selected==='dark'));document.querySelector('meta[name="theme-color"]')?.setAttribute('content',selected==='dark'?'#111C25':'#FAFBFC')}apply();button.addEventListener('click',()=>{selected=selected==='dark'?'light':'dark';try{localStorage.setItem(key,selected)}catch{}apply()})})();
/* Playable Machine Check motion walkthroughs. */
(()=>{'use strict';
document.querySelectorAll('.mc-film').forEach(film=>{
 const button=film.querySelector('.mc-film-toggle');
 const bar=film.querySelector('.mc-film-progress span');
 const time=film.querySelector('.mc-film-time');
 const progress=film.querySelector('.mc-film-progress');
 let started=0,timer=null,raf=null,elapsed=0;
 const duration=14000;
 const update=()=>{
   elapsed=performance.now()-started;
   const seconds=Math.min(14,Math.floor(elapsed/1000));
   time.textContent='0:'+String(seconds).padStart(2,'0')+' / 0:14';
   bar.style.width=Math.min(100,(elapsed/duration)*100)+'%';
   progress.setAttribute('aria-valuenow',String(seconds));
   if(elapsed>=duration){finish();return}
   raf=requestAnimationFrame(update);
 };
 const clear=()=>{clearTimeout(timer);cancelAnimationFrame(raf)};
 const pause=()=>{
   elapsed=Math.min(duration,performance.now()-started);clear();
   film.classList.remove('is-playing');film.classList.add('is-paused');
   button.setAttribute('aria-pressed','false');
   button.querySelector('.mc-button-label').textContent='Resume walkthrough';
 };
 const finish=()=>{
   clear();film.classList.remove('is-playing','is-paused');
   button.setAttribute('aria-pressed','false');
   button.querySelector('.mc-button-label').textContent='Play walkthrough';
   elapsed=0;bar.style.width='0';progress.setAttribute('aria-valuenow','0');time.textContent='0:00 / 0:14';
 };
 const start=(resume=false)=>{
   if(!resume){clear();elapsed=0;bar.style.width='0';progress.setAttribute('aria-valuenow','0')}
   film.classList.remove('is-paused');film.classList.add('is-playing');
   button.setAttribute('aria-pressed','true');
   button.querySelector('.mc-button-label').textContent='Pause walkthrough';
   started=performance.now()-elapsed;
   
   raf=requestAnimationFrame(update);timer=setTimeout(finish,duration-elapsed);
 };
 button.addEventListener('click',()=>{
   if(film.classList.contains('is-playing'))pause();
   else start(film.classList.contains('is-paused'));
 });
 film.querySelector('.mc-replay').addEventListener('click',()=>start(false));
});
})();
