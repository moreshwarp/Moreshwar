/* Moreshwar / Lab contact UI — progressive enhancement.
   Native POST to FormSubmit handles delivery. JavaScript never claims Gmail delivery.
   The pure validator is exported for Node's built-in test runner. */
(function (global) {
 'use strict';
 const CONTACT_EMAIL='moreshwarpidadi@gmail.com';
 const TOPICS=['Research / collaboration','Engineering question','Article feedback','General note'];
 function validateContact({name='',email='',message='',topic=''}={}){
  const n=String(name).trim(),e=String(email).trim(),m=String(message).trim();
  if(n.length<2 || n.length>100)return {ok:false,field:'name',message:'Please include your name (at least 2 characters).'};
  if(e.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))return {ok:false,field:'email',message:'Please enter a valid email address.'};
  if(!TOPICS.includes(String(topic)))return {ok:false,field:'topic',message:'Please select a topic.'};
  if(m.length<2 || m.length>5000)return {ok:false,field:'message',message:'Please write a message (2–5,000 characters).'};
  return {ok:true,field:'',message:''};
 }
 if(typeof module!=='undefined' && module.exports)module.exports={validateContact,TOPICS};
 if(!global.document)return;
 const d=global.document;
 const el=id=>d.getElementById(id);
 const form=el('contact-form');if(!form)return;
 const name=el('contact-name'),email=el('contact-email'),topic=el('contact-topic'),message=el('contact-message');
 const submit=el('contact-submit'),status=el('contact-status'),meter=el('contact-message-count'),
       previewTopic=el('contact-preview-topic'),previewWords=el('contact-preview-words'),
       previewTo=el('contact-preview-to'),signal=el('contact-signal');
 const originalButton=submit.innerHTML;
 const fields={name,email,topic,message};
 function wordCount(text){return text.trim()?text.trim().split(/\s+/).length:0;}
 function update(){
  if(meter)meter.textContent=String(message.value.length)+' / 5000';
  if(previewTopic)previewTopic.textContent=topic.value;
  if(previewWords)previewWords.textContent=String(wordCount(message.value))+' words';
  if(previewTo)previewTo.textContent='GMAIL INBOX / FORM SERVICE';
  if(signal)signal.textContent=message.value.trim().length>=2?'SIGNAL COMPOSED':'AWAITING SIGNAL';
  if(status && status.dataset.state==='error'){status.textContent='Complete the fields, then send when ready.';status.dataset.state='idle';}
 }
 for(const input of Object.values(fields)){if(input)input.addEventListener('input',update);}
 d.querySelectorAll('[data-contact-prompt]').forEach(button=>button.addEventListener('click',()=>{
  const selected=button.dataset.contactPrompt;
  if(!TOPICS.includes(selected))return;
  topic.value=selected;
  if(!message.value.trim()){
   const prompt=button.dataset.suggestion || '';
   message.value=prompt.slice(0,5000);
  }
  update();
  message.focus();
 }));
 form.addEventListener('submit',function(event){
  const v=validateContact({name:name.value,email:email.value,topic:topic.value,message:message.value});
  if(!v.ok){
   event.preventDefault();
   status.textContent=v.message;
   status.dataset.state='error';
   fields[v.field]?.focus();
   return;
  }
  // Do not preventDefault on valid input: browser navigates to FormSubmit.
  // A redirect to our confirmation page can occur only if the provider accepts it.
  status.textContent='Handing the message to the email service. Follow its confirmation steps if prompted.';
  status.dataset.state='sending';
  submit.disabled=true;
  submit.textContent='Opening secure delivery…';
 });
 global.addEventListener('pageshow',()=>{
  submit.disabled=false;
  submit.innerHTML=originalButton;
  if(status && status.dataset.state==='sending'){
   status.textContent='The form is ready. Check your email app if delivery was not confirmed.';
   status.dataset.state='idle';
  }
 });
 update();
})(typeof window!=='undefined'?window:globalThis);
