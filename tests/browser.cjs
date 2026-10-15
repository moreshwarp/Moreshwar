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
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
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
   await page.locator('[data-instrument-mode="ai"]').click();
   assert.equal(await page.locator('#instrument-focus-title').innerText(),'MACHINE LEARNING');
   await page.locator('#menu-trigger').click();
   assert.ok(await page.locator('#mobile-menu').isVisible());
   assert.ok(await page.locator('#mobile-menu a[href="#picks"]').count()===1);
   await page.screenshot({path:path.join(outputs,'owner-published-home-mobile.png')});
   await ctx.close();
  });
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
 else console.log('All '+(sizes.length+3)+' real Chromium browser checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
