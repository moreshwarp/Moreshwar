/* Journal-first browser QA: do not test removed legacy homepage selectors. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_QA_BASE||'http://127.0.0.1:4173/';
const widths=[320,390,768,1440],failures=[];
const artifacts=path.join(__dirname,'..','browser-artifacts');fs.mkdirSync(artifacts,{recursive:true});
async function check(name,fn){try{await fn();console.log('PASS '+name)}catch(e){failures.push(name+': '+e.message);console.error('FAIL '+name,e)}}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  for(const width of widths){
   await check('viewport '+width+' journal, archive, studio and classic',async()=>{
    const ctx=await browser.newContext({viewport:{width,height:850}});
    try{
     for(const route of ['','reading-archive.html','studio.html','classic.html']){
      const page=await ctx.newPage();
      try{
       const errors=[];page.on('pageerror',e=>errors.push(e.message));
       const response=await page.goto(new URL(route,base).href,{waitUntil:'load',timeout:45000});
       assert.equal(response.status(),200,route+' HTTP');
       const geom=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
       assert.ok(geom.scroll<=geom.width+2&&geom.body<=geom.width+2,route+' overflow '+JSON.stringify(geom));
       assert.ok(await page.locator('main').count()>0,route+' missing main landmark');
       assert.deepEqual(errors,[],route+' JS errors');
       if(!route)await page.screenshot({path:path.join(artifacts,'journal-'+width+'.png'),fullPage:true});
      }finally{await page.close()}
     }
    }finally{await ctx.close()}
   });
  }
  await check('reboot navigation, publishing assets and searchable archive',async()=>{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   try{
    await page.goto(base);
    assert.ok(await page.locator('#hero-title').isVisible(),'new homepage hero missing');
    for(const asset of ['favicon.svg','social-preview.png','research-method.svg','mrl-reboot.css']){
      const response=await page.request.get(new URL(asset,base).href);
      assert.equal(response.status(),200,'missing publish asset '+asset);
    }
    await page.locator('#menu').click();
    assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');
    assert.ok(await page.locator('#nav').isVisible());
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
    await page.goto(new URL('reading-archive.html',base).href);
    await page.locator('#q').fill('competition');
    assert.match(await page.locator('#count').innerText(),/essay/);
    assert.ok(await page.locator('.story:visible').count()>=1);
    await page.screenshot({path:path.join(artifacts,'archive-reboot-mobile.png'),fullPage:true});
    await page.goto(new URL('studio.html',base).href);
    await page.screenshot({path:path.join(artifacts,'studio-reboot-mobile.png'),fullPage:true});
   }finally{await page.close()}
  });
  await check('bookshelf loads 143 and search filters',async()=>{
   const page=await browser.newPage({viewport:{width:390,height:850}});
   try{
    await page.goto(base);
    await page.locator('#shelf-toggle').click();
    await page.waitForFunction(()=>document.querySelector('#shelf-list')?.children.length>0,{timeout:15000});
    const data=await page.request.get(new URL('bookshelf.json',base).href);
    assert.equal(data.status(),200);
    assert.equal((await data.json()).books.length,143);
    await page.locator('#shelf-search').fill('Pragmatic');
    await page.waitForTimeout(150);
    assert.match(await page.locator('#shelf-list').innerText(),/Pragmatic/i);
   }finally{await page.close()}
  });
  await check('archive entries link to published articles',async()=>{
   const page=await browser.newPage();
   try{
    await page.goto(new URL('reading-archive.html',base).href);
    const links=await page.locator('a[href*="articles/"]').evaluateAll(els=>[...new Set(els.map(e=>e.getAttribute('href')).filter(Boolean))]);
    assert.ok(links.length>=22,'Expected 22 article links, got '+links.length);
    for(const href of links){const response=await page.request.get(new URL(href,page.url()).href);assert.equal(response.status(),200,href)}
   }finally{await page.close()}
  });
  await check('classic workspace and shared assets published',async()=>{
   const page=await browser.newPage();
   try{
    for(const route of ['classic.html','unified-site.css','studio.html','reading-archive.html']){
     const response=await page.request.get(new URL(route,base).href);assert.equal(response.status(),200,route)
    }
    await page.goto(new URL('classic.html',base).href);
    assert.ok(await page.locator('#systems-lab').count()>0,'systems research missing');
    assert.ok(await page.locator('#contact').count()>0,'contact missing');
   }finally{await page.close()}
  });
 }finally{await browser.close()}
 if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
 else console.log('Journal and classic browser checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});
