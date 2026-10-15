/* Public reader feedback. GitHub Issues handles authentication and moderation. */
(() => {
'use strict';
const root=document.querySelector('[data-reader-feedback]');
if(!root)return;
const issue=Number(root.dataset.issue);
const status=root.querySelector('[data-feedback-status]');
const counts=root.querySelector('[data-feedback-counts]');
const comments=root.querySelector('[data-feedback-comments]');
const githubUrl=issue>0&&Number.isSafeInteger(issue)?'https://github.com/moreshwarp/Moreshwar/issues/'+issue:null;
for(const a of root.querySelectorAll('[data-feedback-open]')) {
  if(githubUrl)a.href=githubUrl;
  else {a.removeAttribute('href');a.setAttribute('aria-disabled','true');}
}
if(!githubUrl){if(status)status.textContent='Discussion becomes available when this article is published.';return}
const endpoint='https://api.github.com/repos/moreshwarp/Moreshwar/issues/'+issue;
const prettyDate=value=>{
 const d=new Date(value);
 return Number.isFinite(d.getTime())?d.toLocaleDateString('en-GB',{month:'short',day:'numeric',year:'numeric'}):'';
};
async function refresh(){
 if(status)status.textContent='Loading public reader conversation…';
 try {
  const [issueRes,commentRes]=await Promise.all([
    fetch(endpoint,{headers:{Accept:'application/vnd.github+json'}}),
    fetch(endpoint+'/comments?per_page=15',{headers:{Accept:'application/vnd.github+json'}})
  ]);
  if(!issueRes.ok||!commentRes.ok)throw new Error('Discussion temporarily unavailable');
  const issueData=await issueRes.json();
  const thread=await commentRes.json();
  if(!Array.isArray(thread)||issueData.state==='closed')throw new Error('Discussion unavailable');
  const likes=(Number(issueData.reactions?.['+1'])||0)+(Number(issueData.reactions?.heart)||0);
  const total=Number(issueData.comments)||0;
  if(counts)counts.textContent=likes+' appreciation'+(likes===1?'':'s')+' · '+total+' comment'+(total===1?'':'s');
  if(comments){
    comments.replaceChildren();
    for(const item of thread.slice(-6)){
      const row=document.createElement('div');row.className='reader-comment';
      const meta=document.createElement('div');meta.className='reader-comment-meta';
      const user=document.createElement('strong');user.textContent=item.user?.login||'Reader';
      const date=document.createElement('time');date.textContent=prettyDate(item.created_at);
      const body=document.createElement('p');body.textContent=String(item.body||'').slice(0,1300);
      meta.append(user,date);row.append(meta,body);comments.append(row);
    }
    if(!thread.length){const p=document.createElement('p');p.className='reader-no-comments';p.textContent='No public comments yet. Start a thoughtful discussion.';comments.append(p);}
  }
  if(status)status.textContent='Comments and reactions are managed by GitHub. Sign in there to participate.';
 }catch(e){
  if(status)status.textContent='Live counts are unavailable right now. The discussion link still works on GitHub.';
  if(counts)counts.textContent='Open discussion ↗';
  if(comments)comments.replaceChildren();
 }
}
refresh();
})();