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
       if(geom.scroll>geom.width+2||geom.body>geom.width+2){const offenders=await page.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,cls:typeof el.className==='string'?el.className.slice(0,100):'',left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right),scroll:el.scrollWidth})).filter(x=>x.right>document.documentElement.clientWidth+2||x.left< -2).slice(0,12));console.error('Overflow offenders '+route+' '+JSON.stringify(offenders));}
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
    await page.locator('.mrl-site-mobile-toggle').click();
    assert.equal(await page.locator('.mrl-site-mobile-toggle').getAttribute('aria-expanded'),'true');
    assert.ok(await page.locator('#mrl-site-navigation').isVisible());
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.mrl-site-mobile-toggle').getAttribute('aria-expanded'),'false');
    await page.goto(new URL('reading-archive.html',base).href);
    await page.locator('#q').fill('competition');
    assert.match(await page.locator('#count').innerText(),/essay/);
    assert.ok(await page.locator('.story:visible').count()>=1);
    await page.screenshot({path:path.join(artifacts,'archive-reboot-mobile.png'),fullPage:true});
    await page.goto(new URL('studio.html',base).href);
    await page.screenshot({path:path.join(artifacts,'studio-reboot-mobile.png'),fullPage:true});
   }finally{await page.close()}
  });
  await check('mobile-first quick navigation and local cross-library search',async()=>{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   try{
    await page.goto(base);
    const bar=page.locator('header.mrl-site-header');
    assert.ok(await bar.isVisible(),'shared academic mobile header missing');
    assert.equal(await page.locator('.mrl-bottom-nav').isVisible(),false,'outdated duplicate bottom toolbar visible');
    const menu=bar.locator('.mrl-site-mobile-toggle');
    assert.ok(await menu.isVisible(),'mobile academic menu missing');
    const targetHeight=await menu.evaluate(el=>el.getBoundingClientRect().height);
    assert.ok(targetHeight>=40,'undersized mobile menu target');
    await menu.click();
    await bar.locator('summary').filter({hasText:'Writing'}).click();
    assert.ok(await bar.locator('.mrl-nav-sub a[href="reading-archive.html"]').isVisible(),'Writing submenu should reveal archive');
    await page.keyboard.press('Escape');
    await bar.locator('.mrl-site-search').click();
    assert.ok(await page.locator('#mrl-global-search').isVisible(),'search dialog unavailable');
    await page.locator('#mrl-search-input').fill('Lamport');
    await page.waitForFunction(()=>document.querySelector('.mrl-search-status')?.textContent?.includes('matching'));
    assert.match(await page.locator('.mrl-search-results').innerText(),/Lamport/i);
    await page.locator('#mrl-search-input').fill('Pragmatic');
    await page.waitForFunction(()=>document.querySelector('.mrl-search-results')?.textContent?.includes('Pragmatic'));
    assert.match(await page.locator('.mrl-search-results').innerText(),/Pragmatic/i);
    await page.screenshot({path:path.join(artifacts,'mobile-search.png')});
    await page.keyboard.press('Escape');
    await page.locator('#mrl-global-search').waitFor({state:'hidden',timeout:5000});
    assert.equal(await page.locator('#mrl-global-search').evaluate(el=>el.open),false);
    await page.goto(new URL('reading-archive.html',base).href);
    await page.locator('[data-mrl-query="netflix"]').click();
    assert.equal(await page.locator('#q').inputValue(),'netflix');
    assert.equal(await page.locator('[data-mrl-query="netflix"]').getAttribute('aria-pressed'),'true');
    assert.ok(await page.locator('.story:visible').count()>0,'Netflix topic should have published essays');
    await page.locator('[data-mrl-query=""]').click();
    assert.equal(await page.locator('.story:visible').count(),22,'clear topic restores archive');
   }finally{await page.close()}
  });
  await check('interactive research map controls and keyboard on mobile and desktop',async()=>{
   for(const width of [320,390,1440]){
    const page=await browser.newPage({viewport:{width,height:850}});
    try{
     await page.goto(base);
     const buttons=page.locator('[data-observatory] button[data-idea]');
     assert.equal(await buttons.count(),5);
     await page.locator('[data-idea="books"]').click();
     assert.equal(await page.locator('#obs-title').innerText(),'The reading shelf');
     assert.equal(await page.locator('#obs-link').getAttribute('href'),'index.html#bookshelf');
     assert.equal(await page.locator('[data-idea="books"]').getAttribute('aria-pressed'),'true');
     await page.locator('[data-idea="books"]').focus();
     await page.keyboard.press('ArrowRight');
     assert.equal(await page.locator('[data-idea="ideas"]').getAttribute('aria-pressed'),'true');
     assert.equal(await page.locator('#obs-title').innerText(),'Original essays');
     const size=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
     assert.ok(size.scroll<=size.client+2,'research map overflow '+JSON.stringify(size));
     await page.screenshot({path:path.join(artifacts,'observatory-'+width+'.png'),fullPage:false});
    }finally{await page.close()}
   }
  });
  await check('visual magazine browsing, topic filtering and real links',async()=>{
   for(const width of [320,390,768,1440]){
    const page=await browser.newPage({viewport:{width,height:850}});
    try{
     await page.goto(base);
     const section=page.locator('#editorial-discovery');
     assert.ok(await section.isVisible());
     assert.equal(await section.locator('.ed-card:visible').count(),6);
     await section.locator('[data-ed-filter="systems"]').click();
     assert.equal(await section.locator('.ed-card:visible').count(),3);
     assert.equal(await section.locator('[data-ed-filter="systems"]').getAttribute('aria-pressed'),'true');
     await section.locator('[data-ed-filter="reading"]').click();
     assert.equal(await section.locator('.ed-card:visible').count(),1);
     await section.locator('#ed-surprise').click();
     assert.ok(await section.locator('.ed-card:focus').count()===1,'surprise control must focus visible card');
     await section.locator('[data-ed-filter="all"]').click();
     assert.equal(await section.locator('.ed-card:visible').count(),6);
     const geom=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
     assert.ok(geom.scroll<=geom.client+2,'discovery overflow '+JSON.stringify(geom));
     for(const asset of ['edition.css','edition.js','vendor/open-props/colors.css','vendor/open-props/easing.css','vendor/open-props/sizes.css']){
      assert.equal((await page.request.get(new URL(asset,base).href)).status(),200,'asset not published '+asset);
     }
     await page.screenshot({path:path.join(artifacts,'magazine-'+width+'.png')});
    }finally{await page.close()}
   }
  });
  await check('research UX cover editions, accessible zoom, consistent controls and scroll',async()=>{
   for(const width of [320,390,1440]){
    const page=await browser.newPage({viewport:{width,height:850}});
    try{
     await page.goto(base);
     await page.locator('#ux-featured-books .ux-book-card').first().waitFor({state:'attached'});
     assert.equal(await page.locator('#ux-featured-books .ux-book-card').count(),3);
     assert.equal(await page.locator('#ux-featured-books a[href^="https://openlibrary.org/isbn/"]').count(),3);
     await page.locator('#ux-theme').click();
     assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');
     await page.locator('#ux-theme').click();
     assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'light');
     assert.equal(await page.locator('.ux-research-figure').isVisible(),false,'decorative research diagram should not appear in text-first mode');
     const geom=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
     assert.ok(geom.scroll<=geom.client+2,'research UX overflow '+JSON.stringify(geom));
     assert.equal((await page.request.get(new URL('assets/distributed-request-flow.svg',base).href)).status(),200);
     await page.screenshot({path:path.join(artifacts,'research-ux-'+width+'.png')});
    }finally{await page.close()}
   }
  });
  await check('shared academic navigation across every route, dropdowns, mobile and search',async()=>{
   for(const width of [320,390,768,1440]){
    const page=await browser.newPage({viewport:{width,height:850}});
    try{
     for(const route of ['','classic.html','reading-archive.html','studio.html']){
      await page.goto(new URL(route,base).href);
      const header=page.locator('header.mrl-site-header');
      assert.ok(await header.isVisible(),route+' shared header not visible');
      assert.equal(await header.locator('details.mrl-nav-group').count(),4);
      const old=page.locator('header.at-header,header.site-header,header.mrl-header,header.nav');
      assert.equal(await old.isVisible(),false,route+' old inconsistent header still visible');
      const doc=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(doc.scroll<=doc.width+2,route+' overflow with new header '+JSON.stringify(doc));
      if(width<940){
       const button=header.locator('.mrl-site-mobile-toggle');
       await button.click();
       assert.equal(await button.getAttribute('aria-expanded'),'true');
       await header.locator('summary').filter({hasText:'Research'}).click();
       assert.ok(await header.locator('a[href="classic.html#systems-lab"]').isVisible());
       await page.keyboard.press('Escape');
       assert.equal(await button.getAttribute('aria-expanded'),'false');
      }else{
       await header.locator('summary').filter({hasText:'Research'}).click();
       assert.ok(await header.locator('a[href="classic.html#systems-lab"]').isVisible());
       await header.locator('summary').filter({hasText:'Writing'}).click();
       assert.equal(await header.locator('details[open]').count(),1);
      }
     }
     await page.goto(new URL('',base).href);
     await page.locator('.mrl-site-search').click();
     assert.ok(await page.locator('#mrl-global-search').isVisible());
     await page.keyboard.press('Escape');
    }finally{await page.close()}
   }
  });
  await check('academic journal reference layout and real writing remain accessible at every width',async()=>{
   for(const width of [320,390,768,1440]){
    const page=await browser.newPage({viewport:{width,height:850}});
    try{
     for(const route of ['','reading-archive.html','studio.html','classic.html']){
      await page.goto(new URL(route,base).href);
      assert.ok(await page.locator('body.mrl-academic').count(),'academic design class missing '+route);
      assert.equal((await page.request.get(new URL('academic-journal.css',base).href)).status(),200);
      assert.ok(await page.locator('header.mrl-site-header').isVisible(),'academic header missing '+route);
      const overflow=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(overflow.scroll<=overflow.width+2,'academic overflow '+route+' '+JSON.stringify(overflow));
     }
     await page.goto(base);
     assert.ok(await page.locator('#academic-directory').isVisible());
     assert.equal(await page.locator('#academic-directory time').count(),5);
     const bg=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor);
     assert.equal(bg,'rgb(255, 255, 255)');
     assert.ok(await page.locator('#academic-directory a[href="reading-archive.html"]').count()>0);
     await page.screenshot({path:path.join(artifacts,'academic-home-'+width+'.png'),fullPage:false});
    }finally{await page.close()}
   }
  });
  await check('scholarly two-column main and sidebar at desktop, single column on mobile',async()=>{
    for(const width of [320,390,768,1440]){
      const page=await browser.newPage({viewport:{width,height:900}});
      try{
        await page.goto(base);
        const main=page.locator('.academic-main'),aside=page.locator('.academic-sidebar');
        assert.ok(await main.isVisible());assert.ok(await aside.isVisible());
        const rects=await page.evaluate(()=>{
          const a=document.querySelector('.academic-main').getBoundingClientRect();
          const b=document.querySelector('.academic-sidebar').getBoundingClientRect();
          return {a:{left:a.left,right:a.right,top:a.top,bottom:a.bottom},b:{left:b.left,right:b.right,top:b.top},width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth};
        });
        if(width<=700)assert.ok(rects.b.top>=rects.a.bottom-2,'sidebar should follow main content '+JSON.stringify(rects));
        else assert.ok(rects.b.left>=rects.a.right-2,'sidebar must be beside main '+JSON.stringify(rects));
        assert.ok(rects.scroll<=rects.width+2,'scholarly layout overflow '+JSON.stringify(rects));
        assert.equal((await page.request.get(new URL('scholarly-layout.css',base).href)).status(),200);
        await page.screenshot({path:path.join(artifacts,'scholarly-'+width+'.png'),fullPage:false});
      }finally{await page.close()}
    }
  });
  await check('reference-style academic navigation, simplified archives and studio sidebars',async()=>{
    for(const width of [320,390,768,1440]){
      const page=await browser.newPage({viewport:{width,height:900}});
      try{
        for(const route of ['','reading-archive.html','studio.html','classic.html']){
          await page.goto(new URL(route,base).href);
          assert.ok(await page.locator('body.mrl-heritage').count(),'academic unification missing '+route);
          assert.equal((await page.request.get(new URL('heritage-unified.css',base).href)).status(),200);
          const geom=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
          assert.ok(geom.scroll<=geom.client+2,'academic overflow '+route+' '+JSON.stringify(geom));
        }
        await page.goto(new URL('reading-archive.html',base).href);
        const main=page.locator('.sch-page-columns main'),aside=page.locator('.sch-page-columns aside.sch-related');
        assert.ok(await aside.isVisible());
        assert.equal(await page.locator('.story').count(),22);
        const positions=await page.evaluate(()=>{
          const a=document.querySelector('.sch-page-columns main').getBoundingClientRect();
          const b=document.querySelector('.sch-page-columns aside').getBoundingClientRect();
          return {mainRight:a.right,mainBottom:a.bottom,asideLeft:b.left,asideTop:b.top};
        });
        if(width>700)assert.ok(positions.asideLeft>=positions.mainRight-3,'sidebar must align right '+JSON.stringify(positions));
        else assert.ok(positions.asideTop>=positions.mainBottom-3,'sidebar must stack below '+JSON.stringify(positions));
        await page.screenshot({path:path.join(artifacts,'heritage-archive-'+width+'.png')});
      }finally{await page.close()}
    }
  });
  await check('every published page shares academic navigation, text layout and no visible images',async()=>{
    const root=path.join(__dirname,'..','_site');
    const scan=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?scan(path.join(dir,entry.name)):(entry.name.endsWith('.html')?[path.join(dir,entry.name)]:[]));
    const routes=scan(root).map(f=>path.relative(root,f).split(path.sep).join('/')).sort();
    assert.ok(routes.length>=30,'expected full public site inventory');
    for(const width of [390,1440]){
      const page=await browser.newPage({viewport:{width,height:850}});
      try{
        for(const route of routes){
          const response=await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});
          assert.equal(response.status(),200,'missing route '+route);
          await page.locator('header.mrl-site-header').waitFor({state:'visible',timeout:5000});
          assert.equal(await page.locator('img:visible').count(),0,'visible image on '+route);
          const metrics=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
          assert.ok(metrics.scroll<=metrics.width+2,'overflow at '+width+' on '+route+' '+JSON.stringify(metrics));
        }
      }finally{await page.close()}
    }
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
