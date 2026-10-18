/* Chromium integration: owner appearance, article feedback, responsive scientific card. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const BASE=process.env.SITE_QA_BASE||'http://127.0.0.1:4173/';
const outputs=path.join(__dirname,'..','browser-artifacts');fs.mkdirSync(outputs,{recursive:true});
const sizes=[320,360,390,430,768,1024,1440];
const errors=[];
async function check(title,run){try{await run();console.log('PASS '+title)}catch(error){console.error('FAIL '+title+': '+error.message);errors.push(title+': '+error.message)}}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
 try {
  for(const width of sizes){
   await check('Responsive scientific card at '+width+'px',async()=>{
    const ctx=await browser.newContext({viewport:{width,height:850},deviceScaleFactor:1,isMobile:width<=430,hasTouch:width<=430});
    const page=await ctx.newPage();
    await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:45000});
    const visual=page.locator('.computational-visual');
    await visual.scrollIntoViewIfNeeded();
    const r=await page.evaluate(()=>{
     const el=s=>document.querySelector(s).getBoundingClientRect();
     const card=el('.computational-visual'),svg=el('.instrument-svg'),focus=el('.instrument-focus');
     return {viewport:innerWidth,scroll:document.documentElement.scrollWidth,card:{x:card.x,right:card.right,bottom:card.bottom},
       svg:{x:svg.x,right:svg.right,bottom:svg.bottom},
       focus:{x:focus.x,right:focus.right,top:focus.top,bottom:focus.bottom}};
    });
    assert.ok(r.scroll<=width+3,'Unexpected horizontal page overflow '+JSON.stringify(r));
    assert.ok(r.card.x>=-3&&r.card.right<=width+3,'Graphic outside phone '+JSON.stringify(r));
    assert.ok(r.svg.x>=r.card.x-3&&r.svg.right<=r.card.right+3,'Clipped SVG '+JSON.stringify(r));
    assert.ok(r.focus.x>=r.card.x-3&&r.focus.right<=r.card.right+3,'Clipped Current Lens '+JSON.stringify(r));
    assert.ok(r.focus.bottom<=r.card.bottom+3,'Focus outside graphic '+JSON.stringify(r));
    if(width<=960)assert.ok(r.focus.top>=r.svg.bottom-3,'Lens is overlapping diagram '+JSON.stringify(r));
    if(width===390||width===1440)await visual.screenshot({path:path.join(outputs,'published-research-graphic-'+width+'.png')});
    await ctx.close();
   });
  }
  await check('Publisher-selected theme cannot be changed by visitors',async()=>{
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const page=await ctx.newPage();
   await page.goto(BASE,{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('html').getAttribute('data-universe'),'science');
   assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
   for(const selector of ['#theme-toggle','#universe-trigger','#theme-studio','#admin-entry','#admin-dialog','#universe-mobile-trigger','#universe-instrument-trigger'])
    assert.equal(await page.locator(selector).count(),0,'Public control found: '+selector);
   await page.evaluate(()=>{localStorage.setItem('moreshwar-theme-v1','light');localStorage.setItem('moreshwar-universe-v1','arcade')});
   await page.reload({waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
   assert.equal(await page.locator('html').getAttribute('data-universe'),'science');
   assert.equal(await page.locator('.pick-card').count(),4);
   // Real painted acceptance for the screenshot discrepancy: no empty Curiosity Index.
   const picks=page.locator('#picks');
   await picks.scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#picks-title').innerText(),'An intellectual field guide.');
   assert.ok((await page.locator('.picks-section .pick-card').first().innerText()).includes('The Imitation Game'));
   assert.equal(await page.locator('.curation-bridge-links a').count(),3);
   await picks.screenshot({path:path.join(outputs,'personalized-curiosity-index-mobile.png')});

   await page.locator('[data-instrument-mode="ai"]').click();
   assert.equal(await page.locator('#instrument-focus-title').innerText(),'MACHINE LEARNING');
   await page.locator('#menu-trigger').click();
   assert.ok(await page.locator('#mobile-menu').isVisible());
   assert.ok(await page.locator('#mobile-menu a[href="#picks"]').count()===1);
   await page.screenshot({path:path.join(outputs,'owner-published-home-mobile.png')});
   await ctx.close();
  });
  await check('Inquiry Engine displays falsifiable questions and computes fan-out risk',async()=>{
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const page=await ctx.newPage();
   await page.goto(BASE,{waitUntil:'domcontentloaded'});
   await page.locator('#inquiry').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('[data-inquiry]').count(),4);
   assert.equal(await page.locator('#inquiry-risk').innerText(),'33.7%');
   await page.locator('#inquiry-services').evaluate(el=>{el.value='16';el.dispatchEvent(new Event('input',{bubbles:true}))});
   assert.equal(await page.locator('#inquiry-services-value').innerText(),'16');
   assert.equal(await page.locator('#inquiry-risk').innerText(),'56.0%');
   await page.locator('[data-inquiry="consistency"]').click();
   assert.ok(await page.locator('#inquiry-simulator').isHidden());
   assert.match(await page.locator('#inquiry-falsifier').innerText(),/leader/);
   await page.locator('[data-inquiry="learning"]').click();
   assert.match(await page.locator('#inquiry-next').innerText(),/public dataset/);
   await page.locator('[data-inquiry="latency"]').click();
   assert.ok(await page.locator('#inquiry-simulator').isVisible());
   await page.locator('#inquiry').screenshot({path:path.join(outputs,'inquiry-engine-mobile.png')});
   const geometry=await page.evaluate(()=>{const r=document.getElementById('inquiry').getBoundingClientRect();return {left:r.left,right:r.right,scroll:document.documentElement.scrollWidth,width:innerWidth}});
   assert.ok(geometry.left>=-3&&geometry.right<=geometry.width+3&&geometry.scroll<=geometry.width+3,'Inquiry overflows mobile viewport '+JSON.stringify(geometry));
   await ctx.close();
  });
  await check('Science & Ideas: verified English listening, rotating ideas and source-linked Nobel stories',async()=>{
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   const page=await ctx.newPage();
   await page.goto(BASE,{waitUntil:'domcontentloaded'});
   await page.locator('#science-ideas').scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.getElementById('science-load-status')?.textContent.includes('Curated source-linked'),null,{timeout:12000});
   assert.equal(await page.locator('.science-pod').count(),8);
   assert.equal(await page.locator('.nobel-portrait').count(),3);
   assert.equal(await page.locator('.nobel-sources a').count(),6);
   const before=await page.locator('#idea-person').innerText();
   await page.locator('#idea-next').click();
   assert.notEqual(await page.locator('#idea-person').innerText(),before);
   await page.locator('[data-listen-region="India"]').click();
   assert.equal(await page.locator('.science-pod').count(),3);
   assert.equal(await page.locator('[data-listen-region="India"]').getAttribute('aria-pressed'),'true');
   await page.locator('[data-listen-region="All"]').click();
   assert.equal(await page.locator('.science-pod').count(),8);
   await page.locator('.nobel-education').first().locator('summary').click();
   assert.ok(await page.locator('.nobel-education').first().getAttribute('open')!==null);
   const bounds=await page.evaluate(()=>{const r=document.getElementById('science-ideas').getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth,scroll:document.documentElement.scrollWidth}});
   assert.ok(bounds.left>=-3&&bounds.right<=bounds.width+3&&bounds.scroll<=bounds.width+3,'Science Ideas overflows on mobile '+JSON.stringify(bounds));
   await page.locator('#science-ideas').screenshot({path:path.join(outputs,'science-ideas-mobile.png')});
   await ctx.close();
  });
  for(const width of [320,390,768,1440]){
   await check('Currently Reading editorial at '+width+'px',async()=>{
    const ctx=await browser.newContext({viewport:{width,height:850},deviceScaleFactor:1,isMobile:width<=430,hasTouch:width<=430,reducedMotion:'reduce'});
    try{
     const page=await ctx.newPage();
     await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:45000});
     const card=page.locator('#library .current-reading');
     await card.scrollIntoViewIfNeeded();
     assert.equal(await card.count(),1);
     assert.equal(await card.locator('h3').innerText(),'The Almanack of Naval Ravikant');
     assert.match(await card.locator('img').getAttribute('alt'),/Cover of The Almanack of Naval Ravikant/);
     assert.match(await card.locator('img').getAttribute('src'),/^https:\/\/d28hgpri8am2if\.cloudfront\.net\//);
     assert.equal(await card.locator('a[target="_blank"][rel="noopener noreferrer"]').count(),3);
     const geometry=await page.evaluate(()=>{
      const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}};
      const card=document.querySelector('.current-reading');
      const links=[...card.querySelectorAll('.current-reading__links a')];
      return {viewport:innerWidth,scroll:document.documentElement.scrollWidth,card:rect('.current-reading'),cover:rect('.current-reading__cover'),
       columns:getComputedStyle(card).gridTemplateColumns.split(' ').length,
       linkHeights:links.map(x=>x.getBoundingClientRect().height)};
     });
     assert.ok(geometry.scroll<=width+3,'Horizontal page overflow '+JSON.stringify(geometry));
     assert.ok(geometry.card.left>=-3&&geometry.card.right<=width+3,'Reading card outside viewport '+JSON.stringify(geometry));
     assert.ok(geometry.cover.left>=geometry.card.left-3&&geometry.cover.right<=geometry.card.right+3,'Cover outside card '+JSON.stringify(geometry));
     assert.equal(geometry.columns,width<=700?1:2,'Unexpected grid columns '+JSON.stringify(geometry));
     assert.ok(geometry.linkHeights.every(h=>h>=43),'Links too small for touch '+JSON.stringify(geometry));
     await card.locator('.current-reading__links a').first().focus();
     const focus=await card.locator('.current-reading__links a').first().evaluate(el=>getComputedStyle(el).outlineStyle);
     assert.notEqual(focus,'none','Keyboard focus outline is missing');
     if(width===390||width===1440)await card.screenshot({path:path.join(outputs,'currently-reading-'+width+'.png')});
    }finally{await ctx.close()}
   });
  }
  await check('Article reactions/comments display safely in current owner theme',async()=>{
   const ctx=await browser.newContext({viewport:{width:430,height:900}});
   const page=await ctx.newPage();
   await page.route('https://api.github.com/repos/moreshwarp/Moreshwar/issues/27**',async route=>{
    const u=route.request().url();
    const data=u.includes('/comments?')?
      [{user:{login:'sample-reader'},body:'A useful question about assumptions. <script>alert(1)</script>',created_at:'2026-10-15T10:00:00Z'}]:
      {number:27,state:'open',comments:1,reactions:{'+1':2,heart:1}};
    await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
   });
   await page.goto(BASE+'articles/fieldnote-tail-latency.html',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('html').getAttribute('data-universe'),'science');
   const feedback=page.locator('[data-reader-feedback]');
   await feedback.scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('[data-feedback-counts]')?.textContent.includes('3 appreciations'),null,{timeout:10000});
   assert.match(await page.locator('[data-feedback-counts]').innerText(),/3 appreciations · 1 comment/);
   assert.match(await page.locator('.reader-comment p').innerText(),/script/);
   assert.equal(await page.locator('.reader-comment script').count(),0);
   assert.equal(await page.locator('[data-feedback-open]').first().getAttribute('href'),'https://github.com/moreshwarp/Moreshwar/issues/27');
   await feedback.screenshot({path:path.join(outputs,'reader-comments-mobile.png')});
   await ctx.close();
  });
  for(const width of [320,390,768,1440])await check('Dated story and archive at '+width+'px',async()=>{
   const ctx=await browser.newContext({viewport:{width,height:850},javaScriptEnabled:false,reducedMotion:"reduce"});
   const page=await ctx.newPage();await page.goto(BASE,{waitUntil:'domcontentloaded'});
   const story=page.locator('#story-of-the-day');await story.scrollIntoViewIfNeeded();
   assert.equal(await story.locator('time').getAttribute('datetime'),'2026-10-18');
   assert.equal(await story.locator('a[target="_blank"]').count(),2);
   const box=await story.locator('article').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+3);
   await story.locator('a[href="stories.html"]').click();await page.waitForURL('**/stories.html');
   await page.locator('nav a').first().click();assert.ok(page.url().endsWith('#story-2026-10-18'));
   assert.ok(await page.locator('#story-2026-10-18').isVisible());
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
   if(width===390)await page.screenshot({path:path.join(outputs,'story-archive-mobile.png'),fullPage:true});
   await page.locator('a[href="index.html#story-of-the-day"]').click();await page.waitForURL('**/index.html#story-of-the-day');await ctx.close();
  });
  for(const width of [320,390,768,1440])await check('Field guide navigation and accessible targets at '+width+'px',async()=>{
   const ctx=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce'});
   const page=await ctx.newPage();await page.goto(BASE,{waitUntil:'domcontentloaded'});
   const guide=page.locator('#start-here');await guide.scrollIntoViewIfNeeded();
   assert.equal(await guide.locator('.directory-grid>a').count(),4);
   const result=await guide.evaluate(el=>({
    targets:[...el.querySelectorAll('a')].map(a=>({exists:!!document.querySelector(a.getAttribute('href')),height:a.getBoundingClientRect().height})),
    width:innerWidth,scroll:document.documentElement.scrollWidth,
    precedes:!!(el.compareDocumentPosition(document.getElementById('story-of-the-day'))&Node.DOCUMENT_POSITION_FOLLOWING)
   }));
   assert.ok(result.targets.every(t=>t.exists&&t.height>=44));assert.ok(result.scroll<=width+3);assert.ok(result.precedes);
   const first=guide.locator('.directory-grid>a').first();await first.focus();
   assert.notEqual(await first.evaluate(el=>getComputedStyle(el).outlineStyle),'none');
   if(width<=390){
    await page.locator('#menu-trigger').click();await page.keyboard.press('Escape');
    assert.equal(await page.locator('#menu-trigger').getAttribute('aria-expanded'),'false');
    assert.ok(await page.locator('#menu-trigger').evaluate(el=>el===document.activeElement));
    await page.locator('#menu-trigger').click();await page.locator('#mobile-menu a[href="#start-here"]').click();
    assert.ok(await page.locator('#mobile-menu').isHidden());assert.ok(await guide.evaluate(el=>el===document.activeElement));
   }
   if(width===390||width===1440)await guide.screenshot({path:path.join(outputs,'field-guide-'+width+'.png')});
   await ctx.close();
  });
  await check('Field guide works without JavaScript',async()=>{
   const ctx=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});
   const page=await ctx.newPage();await page.goto(BASE,{waitUntil:'domcontentloaded'});
   await page.locator('.directory-grid a[href="#library"]').click();await page.waitForURL('**/#library');
   assert.ok(await page.locator('.current-reading').isVisible());await ctx.close();
  });
  await check('No uncaught browser errors for core homepage',async()=>{
   const ctx=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});
   const page=await ctx.newPage();const errs=[];
   page.on('pageerror',error=>errs.push(error.message));
   await page.goto(BASE,{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(1000);
   assert.deepEqual(errs,[]);await ctx.close();
  });
 }finally{await browser.close()}
 if(errors.length){console.error(errors.length+' browser checks failed:\n'+errors.join('\n'));process.exitCode=1}
 else console.log('All real Chromium browser checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
