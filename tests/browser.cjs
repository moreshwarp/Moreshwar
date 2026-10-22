/* Acceptance checks for the published journal, studio, archive and article reader. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const BASE=process.env.SITE_QA_BASE||'http://127.0.0.1:4173/';
const outputs=path.join(__dirname,'..','browser-artifacts');fs.mkdirSync(outputs,{recursive:true});
const failures=[];
async function check(name,fn){try{await fn();console.log('PASS '+name)}catch(e){failures.push(name);console.error('FAIL '+name+'\n'+e.stack)}}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
 try{
 for(const width of [320,360,390,430,768,1024,1440])for(const route of ['index.html','studio.html','reading-archive.html'])await check(route+' at '+width+'px',async()=>{
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(BASE)&&r.status()>=400)errors.push(r.status()+' '+r.url())});
  try{
   const response=await page.goto(new URL(route,BASE).href,{waitUntil:'load'});assert.equal(response.status(),200);
   assert.equal(await page.locator('h1').count(),1);
   // Check every local stylesheet and navigation target, including fragment IDs.
   const targets=await page.locator('a[href],link[rel="stylesheet"]').evaluateAll(nodes=>nodes.map(n=>n.href));
   for(const href of new Set(targets)){
    const url=new URL(href);if(url.origin!==new URL(BASE).origin)continue;
    const r=await ctx.request.get(url.href);assert.equal(r.status(),200,'Missing local target '+href);
    if(url.hash){const html=await r.text();assert.ok(html.includes('id="'+decodeURIComponent(url.hash.slice(1))+'"'),'Missing fragment '+href)}
   }
   if(route==='index.html'){
    if(width<=760){await page.locator('#menu').click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');await page.locator('#nav a[href="#bookshelf"]').click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false')}
    await page.locator('#shelf-toggle').click();await page.waitForFunction(()=>document.querySelectorAll('.shelf-item').length>0);
    const total=await page.locator('.shelf-item').count();assert.ok(total>0);
    await page.locator('#shelf-search').fill('zz-no-matching-book-zz');assert.equal(await page.locator('.shelf-item').count(),0);
    await page.locator('#shelf-search').fill('');assert.equal(await page.locator('.shelf-item').count(),total);
   }else if(route==='studio.html'){
    await page.locator('#search-open').click();assert.equal(await page.locator('#search-panel').getAttribute('aria-hidden'),'false');
    await page.locator('#query').fill('Lamport');assert.ok(await page.locator('#results a').count()>0);
    await page.keyboard.press('Escape');assert.equal(await page.locator('#search-panel').getAttribute('aria-hidden'),'true');assert.ok(await page.locator('#search-open').evaluate(el=>el===document.activeElement));
    if(await page.locator('#menu-open').isVisible()){await page.locator('#menu-open').click();assert.ok(await page.locator('#mobile-sections').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('#menu-open').getAttribute('aria-expanded'),'false')}
   }else{
    const total=await page.locator('.story').count();assert.ok(total>0);
    await page.locator('#q').fill('Lamport');assert.equal(await page.locator('.story:visible').count(),1);
    await page.locator('#q').fill('zz-no-matching-essay-zz');assert.ok(await page.locator('#empty').isVisible());
    await page.locator('#q').fill('');assert.equal(await page.locator('.story:visible').count(),total);
    await page.locator('#year').selectOption('2022');assert.equal(await page.locator('.story:visible').count(),1);
   }
   const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(geometry.scroll<=width+3,'Horizontal overflow '+JSON.stringify(geometry));
   const target=page.locator('a[href]').first();await target.focus();assert.notEqual(await target.evaluate(el=>getComputedStyle(el).outlineStyle),'none');
   assert.deepEqual(errors,[]);
  }finally{await page.screenshot({path:path.join(outputs,route+'-'+width+'.png'),fullPage:true});await ctx.close()}
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
   await page.goto(BASE+'articles/fieldnote-tail-latency.html',{waitUntil:'load'});
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

 }finally{await browser.close()}
 if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
