/* Repository-owned publishing engine. GitHub Pages never receives private drafts. */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const THEMES=new Set(['science','hero','noir','quantum','shinobi','bureau','nature','terminal','circuit','arcade']);
const BASE='https://moreshwarp.github.io/Moreshwar/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,105);
const load=s=>JSON.parse(fs.readFileSync(path.join(ROOT,s),'utf8'));
function settingsOK(s){
 if(!s||!THEMES.has(s.theme)||!['light','dark'].includes(s.brightness))throw Error('Invalid owner appearance');
 return s;
}
function scalar(s){
 const v=String(s||'').trim();
 if(v==='true')return true;if(v==='false')return false;
 if(v[0]==='"'&&v.endsWith('"')){try{return JSON.parse(v)}catch{return v.slice(1,-1)}}
 if(v[0]==="'"&&v.endsWith("'"))return v.slice(1,-1).replace(/''/g,"'");
 return v;
}
function parseFrontMatter(input){
 const raw=String(input||'').replace(/\r\n/g,'\n');
 const block=raw.match(/^---\n([\s\S]*?)\n---[ \t]*\n/);
 if(!block)return {meta:{},body:raw};
 const meta={},lines=block[1].split('\n');
 for(let i=0;i<lines.length;i++){
  const m=lines[i].match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
  if(!m)continue;let v=m[2];
  if(v==='>-'||v==='>'||v==='|-'||v==='|'){
   const arr=[];
   while(i+1<lines.length&&(/^\s+/.test(lines[i+1])||!lines[i+1].trim())){i++;arr.push(lines[i].trim())}
   v=arr.join(v.startsWith('|')?'\n':' ');
  }
  meta[m[1]]=scalar(v);
 }
 return {meta,body:raw.slice(block[0].length)};
}
function allowedUrl(s){
 try{
  const url=new URL(String(s),BASE);
  if(!['https:','http:'].includes(url.protocol))return null;
  if(url.origin==='https://moreshwarp.github.io'&&!url.pathname.startsWith('/Moreshwar/'))return null;
  return url.href;
 }catch{return null}
}
function inline(s){
 let raw=esc(s);
 raw=raw.replace(new RegExp('\\x60([^\\x60\\n]+)\\x60','g'),(_,text)=>'<code>'+text+'</code>');
 raw=raw.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g,(_,label,u)=>{
  const safe=allowedUrl(u);
  return safe?'<a href="'+esc(safe)+'" target="_blank" rel="noopener noreferrer">'+label+'</a>':label;
 });
 return raw.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g,'<em>$1</em>');
}
function markdown(content){
 const lines=String(content||'').replace(/\r\n/g,'\n').split('\n');
 const out=[];let list=null,code=false,buffer=[],para=[];
 const flush=()=>{if(para.length){out.push('<p>'+inline(para.join(' '))+'</p>');para=[]}};
 const close=()=>{if(list){out.push('</'+list+'>');list=null}};
 for(const line of lines){
  const s=line.trim();
  if(s.startsWith(String.fromCharCode(96).repeat(3))){
   flush();close();
   if(code){out.push('<pre><code>'+esc(buffer.join('\n'))+'</code></pre>');buffer=[]}
   code=!code;continue;
  }
  if(code){buffer.push(line);continue}
  if(!s){flush();close();continue}
  const image=s.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if(image){flush();close();const src=allowedUrl(image[2]);if(src)out.push('<figure><img loading="lazy" src="'+esc(src)+'" alt="'+esc(image[1])+'"></figure>');continue}
  const h=s.match(/^(#{1,4})\s+(.+)$/);
  if(h){flush();close();const n=h[1].length;out.push('<h'+n+'>'+inline(h[2])+'</h'+n+'>');continue}
  if(/^---+$/.test(s)){flush();close();out.push('<hr>');continue}
  if(/^>\s?/.test(s)){flush();close();out.push('<blockquote>'+inline(s.replace(/^>\s?/,''))+'</blockquote>');continue}
  const bullet=s.match(/^[-*+]\s+(.+)$/),numbered=s.match(/^\d+\.\s+(.+)$/);
  if(bullet||numbered){
   flush();const tag=bullet?'ul':'ol';
   if(list!==tag){close();out.push('<'+tag+'>');list=tag}
   out.push('<li>'+inline((bullet||numbered)[1])+'</li>');continue;
  }
  close();para.push(s);
 }
 flush();close();if(code)out.push('<pre><code>'+esc(buffer.join('\n'))+'</code></pre>');
 return out.join('\n');
}
function community(issue){
 const n=Number(issue)||0,url=n?'https://github.com/moreshwarp/Moreshwar/issues/'+n:'#';
 return '<section class="reader-community" data-reader-feedback data-issue="'+n+'" aria-labelledby="reader-feedback-heading">'+
 '<div class="reader-community-header"><div><span class="reader-community-kicker">READER DISCUSSION / PUBLIC CHANNEL</span>'+
 '<h2 id="reader-feedback-heading">What did you think?</h2><p>Questions, corrections and generous criticism make ideas better.</p></div>'+
 '<span class="reader-community-counts" data-feedback-counts>Loading reactions…</span></div>'+
 '<div class="reader-community-actions"><a data-feedback-open href="'+url+'" target="_blank" rel="noopener noreferrer">♡ Like on GitHub ↗</a>'+
 '<a data-feedback-open href="'+url+'" target="_blank" rel="noopener noreferrer">✎ Write a comment ↗</a></div>'+
 '<div class="reader-community-comments" data-feedback-comments></div>'+
 '<p class="reader-community-status" role="status" aria-live="polite" data-feedback-status>Loading discussion…</p>'+
 '<p class="reader-community-privacy">Read comments here. GitHub sign-in is required to comment or react; discussions are publicly moderated.</p></section>';
}
function decorate(html,issue){
 let s=String(html);
 s=s.replace(/<script>try\{const saved=localStorage\.getItem\('moreshwar-theme-v1'\)[\s\S]*?<\/script>/g,'');
 s=s.replace(/<script defer src="\.\.\/theme\.js[^"]*"><\/script>/g,'');
 s=s.replace(/<script src="\.\.\/site-settings\.js"><\/script>/g,'');
 s=s.replace(/<link rel="stylesheet" href="\.\.\/reader-feedback\.css[^"]*"\s*\/?>/g,'');
 s=s.replace(/<script defer src="\.\.\/reader-feedback\.js[^"]*"><\/script>/g,'');
 s=s.replace(/<section class="reader-community"[\s\S]*?<\/section>/g,'');
 if(!s.includes('</head>')||!s.includes('</main>')||!s.includes('</body>'))throw Error('Invalid article HTML');
 s=s.replace('</head>','<script src="../site-settings.js"></script><link rel="stylesheet" href="../reader-feedback.css?v=publisher-20261015"></head>');
 s=s.replace('</main>',community(issue)+'</main>');
 s=s.replace('</body>','<script defer src="../reader-feedback.js?v=publisher-20261015"></script></body>');
 return s;
}
function articlePage(post){
 const m=post.meta,title=String(m.title||''),summary=String(m.description||''),date=String(m.date||'').slice(0,10),category=String(m.category||'Research');
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<meta name="theme-color" content="#080d14"><meta name="description" content="'+esc(summary)+'"><title>'+esc(title)+' — Moreshwar Pidadi</title>'+
 '<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">'+
 '<link rel="stylesheet" href="../reader-theme.css?v=publisher-20261015"><link rel="stylesheet" href="../editorial.css?v=publisher-20261015">'+
 '<script src="../site-settings.js"></script></head><body>'+
 '<header class="top shell"><a class="brand" href="../index.html#home">m<span>.</span> / LAB</a><nav><a href="../index.html#writing">Writing</a><a href="../index.html#library">Library</a><a href="../index.html#contact">Contact</a></nav></header>'+
 '<main class="shell"><header class="editorial-heading"><span class="editorial-kicker">MORESHWAR / PUBLISHED RESEARCH NOTEBOOK · '+esc(category.toUpperCase())+'</span>'+
 '<h1>'+esc(title)+'</h1><p class="editorial-summary">'+esc(summary)+'</p>'+
 '<div class="editorial-byline"><strong>Moreshwar Pidadi</strong><time datetime="'+esc(date)+'">'+esc(date)+'</time><span>INDEPENDENT WRITING</span></div></header>'+
 '<article class="editorial-article">'+markdown(post.body)+'</article><footer class="editorial-back"><a href="../index.html#writing">← More writing from Moreshwar</a></footer></main></body></html>';
}
function pickCard(item){
 const url=allowedUrl(item.url);if(!url)return '';
 const kind=String(item.kind||'Reference');
 return '<a class="pick-card" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer"><span class="pick-type">'+esc(kind.toUpperCase())+
 ' / '+(item.approved===true?'PERSONALLY RECOMMENDED':'CURATED LEAD')+'</span>'+
 '<span class="pick-glyph" aria-hidden="true">'+({Movie:'◈',Book:'▤',Article:'⌁',YouTube:'▷'}[kind]||'✧')+'</span>'+
 '<strong>'+esc(item.title)+'</strong><span class="pick-creator">'+esc(item.creator||'')+'</span>'+
 '<p>'+esc(item.note||'')+'</p><span class="pick-open">Explore '+esc(kind)+' ↗</span></a>';
}
function build(outPath){
 const out=path.resolve(ROOT,outPath||'_site');
 fs.mkdirSync(out,{recursive:true});
 const settings=settingsOK(load('data/site-settings.json'));
 const recommendations=load('data/recommendations.json');
 if(!Array.isArray(recommendations))throw Error('Recommendations must be a list');
 const code='/* Owner-published appearance: intentionally no visitor overrides. */\n(function(){var s='+JSON.stringify({theme:settings.theme,brightness:settings.brightness})+';document.documentElement.dataset.theme=s.brightness;document.documentElement.dataset.universe=s.theme;document.documentElement.style.colorScheme=s.brightness;var m=document.querySelector(\'meta[name="theme-color"]\');if(m)m.content=s.brightness==="light"?"#f5f9fb":"#080d14";})();';
 fs.writeFileSync(path.join(out,'site-settings.js'),code);
 const issueMap=path.join(out,'reader-threads.json');
 const map=fs.existsSync(issueMap)?JSON.parse(fs.readFileSync(issueMap,'utf8')):load('data/reader-threads.json');
 const dir=path.join(ROOT,'content/posts');
 const files=fs.readdirSync(dir).filter(n=>/^[a-z0-9][a-z0-9-]*\.md$/.test(n));
 const published=[];
 for(const file of files){
  const info=parseFrontMatter(fs.readFileSync(path.join(dir,file),'utf8'));
  if(info.meta.published!==true||!String(info.meta.title||'').trim())continue;
  info.key='notes-'+slug(path.basename(file,'.md'));
  published.push(info);
  const target=path.join(out,'articles',info.key+'.html');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,decorate(articlePage(info),map[info.key]));
 }
 const articles=path.join(out,'articles');
 const existing=fs.existsSync(articles)?fs.readdirSync(articles):[];
 for(const file of existing){
  if(!file.endsWith('.html')||file.startsWith('notes-'))continue;
  const full=path.join(articles,file);
  fs.writeFileSync(full,decorate(fs.readFileSync(full,'utf8'),map[file.slice(0,-5)]));
 }
 published.sort((a,b)=>String(b.meta.date||'').localeCompare(String(a.meta.date||'')));
 const cards=published.map(a=>'<a class="fresh-essay" href="articles/'+esc(a.key)+'.html"><span class="fresh-essay-date">'+
  esc(a.meta.date||'')+' · '+esc(a.meta.category||'Research')+'</span><strong>'+esc(a.meta.title)+'</strong><p>'+
  esc(a.meta.description||'')+'</p><span class="fresh-essay-read">READ ARTICLE ↗</span></a>').join('\n');
 const pieces={
  PUBLISHED_POSTS:'<div class="fresh-essay-grid">'+(cards||`<div class="fresh-essay-grid"><a class="fresh-essay" href="articles/165015687-leslie-lamport-genius-behind-computers-working-together-fe1d2415aee8.html"><span class="fresh-essay-date">DISTRIBUTED SYSTEMS · ORIGINAL WRITING</span><strong>Leslie Lamport: The ideas behind computers working together</strong><p>My published exploration of logical clocks, coordination, and how distributed systems make sense of time.</p><span class="fresh-essay-read">READ ORIGINAL ARTICLE ↗</span></a><a class="fresh-essay" href="articles/165015680-scryer-netflixs-predictive-auto-scaling-engine-82db2049ca47.html"><span class="fresh-essay-date">SYSTEMS ENGINEERING · ORIGINAL WRITING</span><strong>Inside Scryer: Netflix's predictive autoscaling</strong><p>A look at the infrastructure questions behind streaming reliability, prediction, and scale.</p><span class="fresh-essay-read">READ ORIGINAL ARTICLE ↗</span></a></div>`)+'</div>',
  THEME_PICKS:'<div class="pick-grid">'+recommendations.filter(x=>x.universe===settings.theme).map(pickCard).join('\n')+'</div>',
  CURRENT_UNIVERSE:esc(settings.theme),
  PICK_HEADING:esc(settings.recommendationsHeading),
  PICK_INTRO:esc(settings.recommendationsIntro)
 };
 let index=fs.readFileSync(path.join(out,'index.html'),'utf8');
 for(const [name,html] of Object.entries(pieces)){
  const start='<!--'+name+'_BEGIN-->',end='<!--'+name+'_END-->';
  const a=index.indexOf(start),z=index.indexOf(end);
  if(a<0||z<a||index.indexOf(start,a+1)!==-1||index.indexOf(end,z+1)!==-1)
    throw Error('Missing or repeated build markers '+name);
  index=index.slice(0,a+start.length)+html+index.slice(z);
 }
 fs.writeFileSync(path.join(out,'index.html'),index);
 console.log('Published',published.length,'new articles; preserved',existing.length,'legacy readers; appearance',settings.theme,settings.brightness);
 return {published:published.map(x=>x.key),legacy:existing.length,theme:settings.theme,brightness:settings.brightness};
}
module.exports={esc,slug,parseFrontMatter,allowedUrl,inline,markdown,settingsOK,decorate,articlePage,pickCard,build,community};
if(require.main===module)build(process.argv[2]||'_site');
