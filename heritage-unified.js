/* Academic reference navigation and related-reading sidebar.
 * This is progressive enhancement; content and search remain native and visible.
 * No network access, tracking, or copied third-party frontend code.
 */
(()=>{'use strict';
const doc=document,body=doc.body;
if(!body.classList.contains('mrl-academic'))return;
body.classList.add('mrl-heritage');
const pathname=location.pathname.split('/').pop()||'index.html';
const related={
 'reading-archive.html':{
  title:'Explore the journal',
  intro:'A guided index of topics that connect the published essays with hands-on models.',
  links:[
   ['Start with systems thinking','studio.html#systems-lab'],
   ['Explore research methods','studio.html#inquiry'],
   ['Read the research studio','studio.html']
  ]
 },
 'studio.html':{
  title:'Related research',
  intro:'Follow the questions behind the exercises and essays in the research notebook.',
  links:[
   ['Systems and reliability','studio.html#systems-lab'],
   ['The inquiry engine','studio.html#inquiry'],
   ['Published essays','reading-archive.html'],
   ['Science and ideas','studio.html#science-ideas']
  ]
 }
};
const config=related[pathname];
if(config){
 const main=doc.querySelector('main#main-content');
 if(main&&main.parentNode){
  const wrapper=doc.createElement('div');
  wrapper.className='sch-page-columns';
  main.before(wrapper);wrapper.append(main);
  const aside=doc.createElement('aside');aside.className='sch-related';aside.setAttribute('aria-label','Related reading and research');
  const heading=doc.createElement('h2');heading.textContent=config.title;aside.append(heading);
  const intro=doc.createElement('p');intro.textContent=config.intro;aside.append(intro);
  const links=doc.createElement('ul');
  for(const [name,href] of config.links){const li=doc.createElement('li'),anchor=doc.createElement('a');anchor.href=href;anchor.textContent=name;li.append(anchor);links.append(li)}
  aside.append(links);
  const question=doc.createElement('h2');question.textContent='Research practice';aside.append(question);
  const note=doc.createElement('p');note.textContent='Read a claim, identify its assumptions, design a test, and report what the evidence supports.';aside.append(note);
  const source=doc.createElement('p');const cite=doc.createElement('a');cite.href='https://github.com/moreshwarp/Moreshwar';cite.textContent='Browse the project source on GitHub';source.append(cite);aside.append(source);
  wrapper.append(aside);
 }
}
})();