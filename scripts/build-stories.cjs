/* Curated history, never an automatically invented daily story. */
const fs=require('node:fs'),path=require('node:path');
const {esc}=require('./build-content.cjs');
function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
function selectStories(items,today){
 if(!validDate(today)||!Array.isArray(items))throw Error('Invalid stories or build date');
 const dates=new Set();
 return items.filter(s=>s.published===true).map(s=>{
  if(!validDate(s.date)||!validDate(s.reviewedOn)||s.reviewedOn>today||s.reviewedOn>s.date)throw Error('Invalid story dates');
  if(dates.has(s.date))throw Error('Duplicate story date '+s.date);dates.add(s.date);
  for(const key of ['title','summary','body','question'])if(typeof s[key]!=='string'||!s[key].trim())throw Error('Missing story '+key);
  if(!Array.isArray(s.sources)||!s.sources.length)throw Error('Story needs sources');
  for(const source of s.sources){let u;try{u=new URL(source.url)}catch{throw Error('Invalid source URL')}
   if(u.protocol!=='https:'||u.username||u.password||!source.label?.trim())throw Error('Invalid source URL or label');}
  return s;
 }).filter(s=>s.date<=today).sort((a,b)=>b.date.localeCompare(a.date));
}
function card(s,archive=false){return '<article class="daily-story" id="story-'+esc(s.date)+'" aria-labelledby="story-title-'+esc(s.date)+'"><p class="mono">'+(archive?'EDITORIAL DATE':'STORY OF THE DAY · EDITORIAL DATE')+' / <time datetime="'+esc(s.date)+'">'+esc(s.date)+'</time></p><h3 id="story-title-'+esc(s.date)+'">'+esc(s.title)+'</h3><p>'+esc(s.summary)+'</p><p>'+esc(s.body)+'</p><blockquote><strong>A question to investigate</strong><p>'+esc(s.question)+'</p></blockquote><ul>'+s.sources.map(x=>'<li><a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">'+esc(x.label)+' ↗</a></li>').join('')+'</ul><p class="mono micro">Source review: '+esc(s.reviewedOn)+' · AI-assisted summary checked against linked sources. The question is an editorial prompt.</p></article>';}
function buildStories(out,today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())){
 const all=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/stories.json'),'utf8'));
 const stories=selectStories(all,today),latest=stories[0];
 const fragment='<section class="section" id="story-of-the-day" aria-labelledby="daily-story-heading"><div class="shell"><h2 id="daily-story-heading">Story of the Day</h2><p>Source-linked stories from science and engineering. Curated when reviewed; the latest entry stays visible between updates.</p>'+(latest?card(latest):'<p>No reviewed story has been published yet.</p>')+'<p><a href="stories.html">Browse the dated story archive →</a></p></div></section>';
 const file=path.join(out,'index.html');let html=fs.readFileSync(file,'utf8');
 const pattern=/<!--STORY_OF_DAY_BEGIN-->[\s\S]*?<!--STORY_OF_DAY_END-->/;
 if(!pattern.test(html))throw Error('Missing Story of the Day markers');
 html=html.replace(pattern,'<!--STORY_OF_DAY_BEGIN-->'+fragment+'<!--STORY_OF_DAY_END-->');fs.writeFileSync(file,html);
 const archive='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Story archive — Moreshwar / Lab</title><meta name="description" content="Dated, source-linked science and engineering stories."><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="design-system.css?v=20261018"><link rel="stylesheet" href="research-reader.css?v=20261018"><style>html{scroll-behavior:auto}</style><script src="site-settings.js"></script></head><body><main class="shell section"><p><a href="index.html#story-of-the-day">← Back to the Lab</a></p><h1>Story archive</h1><p>Dates identify curated entries, not the historical events. Each entry preserves its own sources and review date.</p><nav aria-label="Stories by date">'+stories.map(s=>'<p><a href="#story-'+esc(s.date)+'">'+esc(s.date)+' — '+esc(s.title)+'</a></p>').join('')+'</nav>'+(stories.map(s=>card(s,true)).join('')||'<p>No reviewed stories yet.</p>')+'</main></body></html>';
 fs.writeFileSync(path.join(out,'stories.html'),archive);return stories;
}
module.exports={validDate,selectStories,card,buildStories};
