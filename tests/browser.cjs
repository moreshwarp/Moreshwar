/* Researcher-first browser QA: verify actual reading UI and every linked section. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_QA_BASE||'http://127.0.0.1:4173/';
const widths=[320,390,768,1440],failures=[],artifacts=path.join(__dirname,'..','browser-artifacts');
fs.mkdirSync(artifacts,{recursive:true});
async function check(label,fn){try{await fn();console.log('PASS '+label)}catch(e){failures.push(label+': '+e.message);console.error('FAIL '+label,e)}}
const rgb=s=>[...(String(s).match(/[0-9.]+/g)||[])].slice(0,3).map(Number);
const lum=s=>rgb(s).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  await check('all public routes render without overflow or script errors on phones and desktop',async()=>{
   for(const width of widths){
    const context=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce'});
    try{
     for(const route of ['','reading-archive.html','studio.html','articles/fieldnote-queues.html','assets/machine-check/showcase.html']){
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
       const res=await page.goto(new URL(route,base).href,{waitUntil:'load'});
       assert.equal(res.status(),200,route);
       await page.locator('main').first().waitFor({state:'visible'});
       const dim=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
       assert.ok(dim.scroll<=dim.width+2&&dim.body<=dim.width+2,route+' overflow '+JSON.stringify(dim));
       assert.deepEqual(errors,[],route+' JS errors');
       if(route===''||route==='studio.html')await page.screenshot({path:path.join(artifacts,(route||'home').replace('.html','')+'-'+width+'.png'),fullPage:false});
      }finally{await page.close()}
     }
    }finally{await context.close()}
   }
  });
  await check('researcher homepage has five navigational tabs including Machine Check',async()=>{
   const page=await browser.newPage({viewport:{width:1440,height:900}});
   try{
    await page.goto(base);
    const labels=await page.locator('.site-navigation a').allTextContents();
    assert.deepEqual(labels.map(x=>x.trim()),['Home','Research','Machine Check','Writing','About']);
    assert.equal(await page.locator('.site-header').count(),1);
    assert.ok((await page.locator('main h1').innerText()).trim().length>10);
    assert.equal(await page.locator('.question-grid').count(),1);
    assert.equal(await page.locator('.about-card').count(),1);
    for(const id of ['research-projects','experiments','writing','studying','about-profile'])assert.equal(await page.locator('#'+id).count(),1,id);
    for(const selector of ['#bookshelf','#reading-desk','.ed-card','.rs-project','.obs-frame','.rs-hero-visual','.mrl-bottom-nav'])assert.equal(await page.locator(selector).count(),0,selector);
    assert.ok((await page.locator('time[datetime]').count())>=4);
    const layout=await page.evaluate(()=>{const a=document.querySelector('.hero-text').getBoundingClientRect(),b=document.querySelector('.trace').getBoundingClientRect();return{mainRight:a.right,sideLeft:b.left,sideTop:b.top}});
    assert.ok(layout.sideLeft>=layout.mainRight,JSON.stringify(layout));
   }finally{await page.close()}
  });
  await check('mobile researcher page has no clipped headings and sidebar stacks below writing',async()=>{
   const page=await browser.newPage({viewport:{width:320,height:850}});
   try{
    await page.goto(base);
    const geom=await page.evaluate(()=>{const a=document.querySelector('.hero-text').getBoundingClientRect(),b=document.querySelector('.trace').getBoundingClientRect();return{bottom:a.bottom,top:b.top,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}});
    assert.ok(geom.top>=geom.bottom-2,JSON.stringify(geom));
    assert.ok(geom.scroll<=geom.client+2);
    assert.equal(await page.locator('.site-navigation a:visible').count(),5);
   }finally{await page.close()}
  });
  await check('Machine Check walkthrough controls respond to play, pause, and replay',async()=>{
   const page=await browser.newPage({viewport:{width:390,height:850}});
   try{
    const response=await page.goto(new URL('assets/machine-check/showcase.html',base).href);
    assert.equal(response.status(),200);
    const films=page.locator('.mc-film');
    assert.equal(await films.count(),2);
    const first=films.first(),toggle=first.locator('.mc-film-toggle').first();
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-pressed'),'true');
    assert.equal(await toggle.locator('.mc-button-label').innerText(),'Pause walkthrough');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-pressed'),'false');
    assert.equal(await toggle.locator('.mc-button-label').innerText(),'Resume walkthrough');
    await first.locator('.mc-replay').click();
    assert.equal(await toggle.getAttribute('aria-pressed'),'true');
   }finally{await page.close()}
  });
  await check('slate-blue light and dark themes have readable contrast',async()=>{
   const page=await browser.newPage({viewport:{width:390,height:850}});
   try{
    await page.goto(base);
    await page.evaluate(()=>localStorage.removeItem('mrl-research-theme'));
    await page.reload();
    for(const [mode,expected] of [['light','rgb(247, 245, 240)'],['dark','rgb(13, 16, 20)']]){
     const data=await page.evaluate(()=>{const body=getComputedStyle(document.body),a=getComputedStyle(document.querySelector('#writing .more a')),heading=getComputedStyle(document.querySelector('h1'));return{mode:document.documentElement.dataset.theme,background:body.backgroundColor,ink:body.color,link:a.color,heading:heading.color}});
     assert.equal(data.mode,mode);assert.equal(data.background,expected);
     assert.ok(contrast(data.ink,data.background)>=7,'body '+mode+' contrast '+JSON.stringify(data));
     assert.ok(contrast(data.heading,data.background)>=7,'heading '+mode+' contrast '+JSON.stringify(data));
     assert.ok(contrast(data.link,data.background)>=4.5,'link '+mode+' contrast '+JSON.stringify(data));
     await page.screenshot({path:path.join(artifacts,'research-home-'+mode+'.png'),fullPage:false});
     await page.locator('#theme-toggle').click();
    }
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'light');
   }finally{await page.close()}
  });
  await check('home navigation and dated writing links lead to real pages or anchors',async()=>{
   const page=await browser.newPage();try{
    await page.goto(base);
    const hrefs=await page.locator('main a[href], .site-navigation a[href], footer a[href]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.getAttribute('href')))]);
    for(const href of hrefs){
     if(href.startsWith('#')){assert.equal(await page.locator(href).count(),1,href);continue}
     if(/^https?:\/\//.test(href)||href.startsWith('mailto:'))continue;
     const [target,hash]=href.split('#'),url=new URL(target,page.url()),res=await page.request.get(url.href);
     assert.equal(res.status(),200,href+' is broken');
     if(hash){const anchor=await page.request.get(url.href);assert.ok((await anchor.text()).includes('id="'+hash+'"'),href+' target anchor missing')}
    }
    const removed=await page.request.get(new URL('bookshelf.json',base).href);
    assert.equal(removed.status(),404,'removed book catalog should not be published');
   }finally{await page.close()}
  });
  await check('archive search filters retained essays and deep-link article navigation works',async()=>{
   const page=await browser.newPage({viewport:{width:390,height:850}});
   try{
    await page.goto(new URL('reading-archive.html',base).href);
    assert.equal(await page.locator('.story').count(),22);
    await page.locator('#q').fill('Netflix');
    await page.waitForFunction(()=>document.querySelectorAll('.story:not([hidden])').length<22,{timeout:10000});
    const filtered=await page.locator('.story:visible').count();
    assert.ok(filtered>0&&filtered<22,'archive filter did not narrow results '+filtered);
    await page.locator('#q').fill('');
    await page.waitForFunction(()=>document.querySelectorAll('.story:not([hidden])').length===22,{timeout:10000});
    assert.equal(await page.locator('.story:visible').count(),22);
    await page.goto(new URL('articles/fieldnote-queues.html',base).href);
    assert.ok(await page.locator('main h1').count()>0);
    assert.ok(await page.locator('.sch-reader-header').isVisible());
    assert.ok(await page.locator('a[href="../index.html"]').count()>0);
   }finally{await page.close()}
  });
  await check('no text is squeezed into an unreadably narrow column on a phone',async()=>{
   // Regression guard: a grid list item whose content is split across grid cells can push
   // prose into a tiny marker column, which renders one word per line on a real phone.
   const context=await browser.newContext({viewport:{width:393,height:850},isMobile:true,hasTouch:true,deviceScaleFactor:2.75});
   try{
    for(const route of ['','studio.html','reading-archive.html','paul-graham.html','memory-lab/index.html','articles/fieldnote-queues.html']){
     const page=await context.newPage();
     try{
      await page.goto(new URL(route,base).href,{waitUntil:'load'});
      await page.locator('main').first().waitFor({state:'visible'});
      const squeezed=await page.evaluate(()=>{
       // Text split across grid cells lands in an anonymous box with no element of its own,
       // so measuring widths misses it. Instead compare the rendered height against the
       // height this much text should need at this width.
       const bad=[];
       document.querySelectorAll('li,p,dd,dt,td,blockquote').forEach(el=>{
        if(el.children.length>2)return;
        const text=(el.textContent||'').replace(/\s+/g,' ').trim();
        if(text.length<80)return;
        const box=el.getBoundingClientRect();
        if(!box.width||!box.height)return;
        const style=getComputedStyle(el);
        if(style.visibility==='hidden'||style.display==='none')return;
        if(/pre/.test(style.whiteSpace))return;
        const lineHeight=parseFloat(style.lineHeight)||parseFloat(style.fontSize)*1.4;
        const charWidth=parseFloat(style.fontSize)*0.5;          // rough but stable
        const perLine=Math.max(1,box.width/charWidth);
        const expected=Math.ceil(text.length/perLine);
        const actual=box.height/lineHeight;
        if(actual>expected*2.2+1)
         bad.push(el.tagName+'.'+(el.className||'')+' w='+Math.round(box.width)+
                  ' lines='+Math.round(actual)+' expected~'+expected);
       });
       return [...new Set(bad)];
      });
      assert.deepEqual(squeezed,[],route+' squeezed text: '+squeezed.join(' | '));
     }finally{await page.close()}
    }
   }finally{await context.close()}
  });
  await check('Studio research destinations remain accessible after homepage redesign',async()=>{
   const page=await browser.newPage({viewport:{width:390,height:850}});
   try{
    await page.goto(new URL('studio.html',base).href);
    for(const id of ['systems-lab','inquiry','science-ideas','contact'])assert.ok(await page.locator('#'+id).count()>0,id);
    const tabs=await page.locator('.mrl-site-header .mrl-nav-group').count();
    assert.ok(tabs<=3,'Studio header navigation exceeds agreed site menu');
   }finally{await page.close()}
  });
 }finally{await browser.close()}
 if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
})();
