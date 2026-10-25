// Moreshwar / Lab — zero-dependency regression checks
// Run from repository root: node --test tests/site.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('classic.html');
const app=read('app.js');
const contact=read('contact.js');
const experience=read('experience.css');
const {validateContact,TOPICS}=require('../contact.js');
const form=html.match(/<form id="contact-form"[\s\S]*?<\/form>/)?.[0] || '';
test('HTML source preserves all 22 published Substack articles',()=>{
 assert.equal((html.match(/<li><a href="articles\//g)||[]).length,22);
 assert.match(html,/id="published-article-index"/);
});
test('all 3 systems research notes and models remain present',()=>{
 assert.equal((html.match(/class="fieldnote-card"/g)||[]).length,3);
 assert.equal((html.match(/class="lab-panel /g)||[]).length,3);
 for(const page of ['fieldnote-tail-latency','fieldnote-stale-reads','fieldnote-queues']){
  assert.ok(fs.existsSync(path.join(root,'articles',page+'.html')));
 }
 for(const file of ['lab.css','lab.js'])assert.ok(fs.existsSync(path.join(root,file)));
});
test('canonical URL and actual GitHub Pages case are correct',()=>{
 assert.match(form,/name="_next" value="https:\/\/moreshwarp\.github\.io\/Moreshwar\/message-received\.html"/);
 assert.match(read('message-received.html'),/href="\.\/#writing"/);
 assert.match(html,/href="experience\.css\?v=/);
});
test('contact uses plain browser POST and a reachable confirmation page',()=>{
 assert.match(form,/action="https:\/\/formsubmit\.co\/moreshwarpidadi@gmail\.com"/);
 assert.match(form,/method="POST"/);
 assert.match(form,/name="_honey"/);
 assert.match(form,/name="_subject"/);
 assert.match(form,/name="email"/);
 assert.match(form,/name="message"/);
 assert.doesNotMatch(contact,/fetch\(/);
 assert.match(contact,/Do not preventDefault on valid input/);
 assert.doesNotMatch(app,/const contactEndpoint/);
});
test('contact fields and visual preview are connected',()=>{
 for(const id of ['contact-name','contact-email','contact-topic','contact-message',
   'contact-submit','contact-status','contact-message-count','contact-preview-topic','contact-preview-words']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/data-contact-prompt=/);
 assert.match(experience,/contact-route-stepper/);
});
test('validator accepts a well-formed enquiry',()=>{
 assert.deepEqual(validateContact({
  name:'Research visitor',email:'visitor@example.com',
  message:'Could we discuss tail latency?',topic:'Research / collaboration'
 }),{ok:true,field:'',message:''});
});
test('validator rejects invalid fields with clear ownership',()=>{
 const normal={name:'Someone',email:'test@example.com',message:'Discuss reliability',topic:'Engineering question'};
 for(const [edit,field] of [[{name:'X'},'name'],[{email:'bad-email'},'email'],
  [{message:' '},'message'],[{topic:'made-up'},'topic']]){
  const result=validateContact({...normal,...edit});
  assert.equal(result.ok,false);
  assert.equal(result.field,field);
 }
});
test('topic selection values match the form UI',()=>{
 for(const t of TOPICS)assert.ok(form.includes('<option>'+t+'</option>'));
});
test('library has suggested resources in every filter category',()=>{
 for(const type of ['Book','Paper','Article','Course']){
  assert.match(html,new RegExp('data-book-filter="'+type+'"'));
  assert.ok(app.includes('kind:\''+type+'\'') || app.includes('"kind":"'+type+'"'), 'Missing suggested '+type);
 }
 assert.match(app,/library-empty-panel/);
 assert.match(app,/data-library-reset/);
 assert.match(html,/library-shelf-header/);
});
test('responsive and reduced-motion support remain available',()=>{
 assert.match(experience,/@media\(max-width:650px\)/);
 assert.match(experience,/prefers-reduced-motion:reduce/);
 assert.match(html,/aria-live="polite"/);
});
test('no unpublished drafts are added to visible article cards',()=>{
 assert.equal((html.match(/class="fieldnote-card"/g)||[]).length,3);
 assert.doesNotMatch(html,/class="demo-card"/);
});
