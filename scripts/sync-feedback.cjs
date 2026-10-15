/* Idempotent per-article discussion setup, GitHub Actions only.
 * Requires issues:write for GITHUB_TOKEN. No tokens ship to GitHub Pages. */
const fs=require('node:fs'),path=require('node:path');
const {parseFrontMatter,slug}=require('./build-content.cjs');
const root=path.resolve(__dirname,'..');
const target=path.join(root,process.argv[2]||'_site');
const map={...JSON.parse(fs.readFileSync(path.join(root,'data/reader-threads.json'),'utf8'))};
const token=process.env.GITHUB_TOKEN;
const repo=process.env.GITHUB_REPOSITORY||'moreshwarp/Moreshwar';
const BASE='https://api.github.com/repos/'+repo;
async function api(method,route,body){
 const response=await fetch(BASE+route,{
  method,
  headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},
  body:body?JSON.stringify(body):undefined
 });
 if(!response.ok)throw Error('GitHub issue service returned '+response.status+' for '+route+': '+(await response.text()).slice(0,400));
 return response.json();
}
async function main(){
 fs.mkdirSync(target,{recursive:true});
 const articles=fs.readdirSync(path.join(root,'content/posts')).filter(x=>x.endsWith('.md'));
 const live=articles.map(file=>{
  const raw=fs.readFileSync(path.join(root,'content/posts',file),'utf8');
  const post=parseFrontMatter(raw);
  return {key:'notes-'+slug(path.basename(file,'.md')),title:String(post.meta.title||''),published:post.meta.published===true};
 }).filter(p=>p.published&&p.title);
 if(!token){
  console.log('No GitHub token provided: using existing mapped conversations; new discussions need a GitHub Actions deployment.');
 }else if(live.some(p=>!map[p.key])){
  const issues=[];
  for(let page=1;page<10;page++){
   const response=await api('GET','/issues?state=all&per_page=100&page='+page);
   issues.push(...response.filter(x=>!x.pull_request));
   if(response.length<100)break;
  }
  for(const post of live){
   if(map[post.key])continue;
   const found=issues.find(i=>i.body&&i.body.includes('ARTICLE_KEY: '+post.key));
   if(found){map[post.key]=found.number;continue}
   const text='## Reader conversation\n\nDiscuss the article **'+post.title+'**: https://moreshwarp.github.io/Moreshwar/articles/'+post.key+'.html\n\nPlease keep feedback constructive. React using 👍 or ❤️ on GitHub.\n\n<!-- ARTICLE_KEY: '+post.key+' -->';
   const issue=await api('POST','/issues',{title:'Reader discussion · '+post.title,body:text});
   map[post.key]=issue.number;
   console.log('Opened article discussion #'+issue.number+' for '+post.key);
  }
 }
 fs.writeFileSync(path.join(target,'reader-threads.json'),JSON.stringify(map,null,2)+'\n');
 console.log('Available comment/like threads:',Object.keys(map).length);
}
main().catch(err=>{console.error(err);process.exitCode=1});
