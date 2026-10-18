const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {selectStories,card,buildStories}=require('../scripts/build-stories.cjs');
const data=require('../data/stories.json'),today='2026-10-18';
test('published stories require valid unique dates and source provenance',()=>{
 for(const patch of [{date:'2026-02-30'},{reviewedOn:'2026-10-19'},{sources:[]},{sources:[{url:'javascript:alert(1)',label:'bad'}]},{title:''}])assert.throws(()=>selectStories([{...data[0],...patch}],today));
 assert.throws(()=>selectStories([data[0],data[0]],today),/Duplicate/);
});
test('drafts and scheduled entries stay out; archive order is newest first',()=>{
 const older={...data[0],date:'2026-10-17',reviewedOn:'2026-10-17'};
 assert.deepEqual(selectStories([older,{published:false},data[0],{...data[0],date:'2026-10-19'}],today).map(s=>s.date),[today,'2026-10-17']);
});
test('story content and source labels escape HTML',()=>{
 const html=card({...data[0],title:'<script>alert(1)</script>',sources:[{url:'https://example.com/?x="',label:'<img src=x>'}]});
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));assert.match(html,/noopener noreferrer/);assert.match(html,/&lt;script&gt;/);
});
test('build creates source-linked homepage and permanent dated archive without JavaScript',()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'stories-'));
 try{fs.writeFileSync(path.join(out,'index.html'),'<!--STORY_OF_DAY_BEGIN-->old<!--STORY_OF_DAY_END-->');buildStories(out,today);
 const index=fs.readFileSync(path.join(out,'index.html'),'utf8'),archive=fs.readFileSync(path.join(out,'stories.html'),'utf8');
 assert.match(index,/CERN/);assert.match(index,/stories.html/);assert.match(archive,/id="story-2026-10-18"/);assert.match(archive,/site-settings.js/);assert.match(archive,/Source review/);
 }finally{fs.rmSync(out,{recursive:true,force:true})}
});
