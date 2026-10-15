/* Real-browser responsive and Theme Studio integration checks.
 * Launched by .github/workflows/browser-qa.yml
 * Unlike unit tests, this inspects actual browser box geometry at phone widths.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const BASE = process.env.SITE_QA_BASE || 'http://127.0.0.1:4173/';
const artifacts = path.join(__dirname, '..', 'browser-artifacts');
fs.mkdirSync(artifacts, { recursive: true });
const themeIds = ['science','hero','noir','quantum','shinobi','bureau','nature','terminal','circuit','arcade'];
const widths = [320, 360, 390, 430, 768, 1024, 1440];
const failures=[];
async function stage(name, fn) {
 try { await fn(); process.stdout.write('PASS '+name+'\n');}
 catch(error) { failures.push(name+': '+error.message); process.stderr.write('FAIL '+name+' — '+error.message+'\n');}
}
async function geometry(page) {
 return page.evaluate(()=>{
  const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const vis=document.querySelector('.hero-visual.computational-visual').getBoundingClientRect();
  const svg=document.querySelector('.instrument-svg').getBoundingClientRect();
  const focus=document.querySelector('.instrument-focus').getBoundingClientRect();
  const tabs=[...document.querySelectorAll('.instrument-tab')].map(b=>{const r=b.getBoundingClientRect();return {x:r.x,right:r.right,top:r.top,bottom:r.bottom}});
  const header=document.querySelector('.nav-inner');
  const headerRect=header.getBoundingClientRect();
  const navElements=[header.querySelector('.brand'),...header.querySelectorAll('.nav-actions > :not([style*="display: none"])')].filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right}});

  return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,header:{x:headerRect.x,right:headerRect.right,elements:navElements},visual:{x:vis.x,right:vis.right,width:vis.width,top:vis.top,bottom:vis.bottom},svg:{x:svg.x,right:svg.right,width:svg.width,bottom:svg.bottom},focus:{x:focus.x,right:focus.right,width:focus.width,top:focus.top,bottom:focus.bottom},tabs};
 });
}
(async () => {
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const w of widths){
   await stage('Responsive layout '+w+'px', async()=>{
    const context=await browser.newContext({viewport:{width:w,height:850}, deviceScaleFactor:1,isMobile:w<=430,hasTouch:w<=430});
    const page=await context.newPage();
    await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#instrument-surface',{timeout:12000});
    await page.locator('#instrument-surface').scrollIntoViewIfNeeded();
    const d=await geometry(page);
    const tolerance=3;
    assert.ok(d.scrollWidth<=w+tolerance,'horizontal document overflow '+JSON.stringify(d));
    assert.ok(d.visual.x>=-tolerance && d.visual.right<=w+tolerance,'hero visual outside viewport '+JSON.stringify(d));
    assert.ok(d.svg.x>=d.visual.x-tolerance && d.svg.right<=d.visual.right+tolerance,'svg clipped horizontally '+JSON.stringify(d));
    assert.ok(d.focus.x>=d.visual.x-tolerance && d.focus.right<=d.visual.right+tolerance,'focus status clipped horizontally '+JSON.stringify(d));
    assert.ok(d.focus.width>=130,'focus status collapsed '+JSON.stringify(d));
    assert.ok(d.focus.bottom<=d.visual.bottom+tolerance,'focus status extends past visual card '+JSON.stringify(d));
    if(w<=960){
      assert.ok(d.focus.top>=d.svg.bottom-tolerance,
        'status overlaps the SVG at a stacked viewport '+JSON.stringify(d));
    }
    if(w<=430){
      for(const [i,n] of d.header.elements.entries()){
        assert.ok(n.x>=-tolerance && n.right<=w+tolerance,
          'header control '+i+' clipped at '+w+'px '+JSON.stringify(d.header));
      }
    }
    for(const [i,b] of d.tabs.entries()){
      assert.ok(b.x>=d.visual.x-tolerance && b.right<=d.visual.right+tolerance,'tab '+i+' outside card '+JSON.stringify(d));
    }
    if(w===390 || w===1440){
      await page.screenshot({path:path.join(artifacts,'hero-'+w+'.png'),fullPage:false});
      await page.locator('.hero-visual.computational-visual').screenshot({path:path.join(artifacts,'instrument-'+w+'.png')});
    }
    await context.close();
   });
  }
  await stage('Lens controls, Theme Studio, persistence and mobile menu',async()=>{
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const page=await context.newPage();
   await page.goto(BASE,{waitUntil:'domcontentloaded'});
   await page.locator('[data-instrument-mode="frontend"]').click();
   assert.equal(await page.locator('#instrument-focus-title').innerText(),'FRONTEND ENGINEERING');
   await page.locator('#universe-instrument-trigger').click();
   assert.ok(await page.locator('#theme-studio').isVisible(),'Theme Studio did not open');
   assert.equal(await page.locator('[data-universe-select]').count(),10);
   await page.locator('[data-universe-select="hero"]').click();
   assert.equal(await page.locator('html').getAttribute('data-universe'),'hero');
   assert.ok(!(await page.locator('#theme-studio').isVisible()),'Theme Studio did not close on selection');
   await page.locator('#universe-instrument-trigger').click();
   await page.locator('[data-brightness="light"]').click();
   assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
   await page.locator('#theme-studio-close').click();
   await page.reload({waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('html').getAttribute('data-theme'),'light','brightness not persisted');
   assert.equal(await page.locator('html').getAttribute('data-universe'),'hero','universe not persisted');
   await page.locator('#menu-trigger').click();
   assert.ok(await page.locator('#mobile-menu').isVisible(),'Mobile navigation not open');
   await page.locator('#universe-mobile-trigger').click();
   assert.ok(await page.locator('#theme-studio').isVisible(),'Mobile menu Theme Studio failed');
   await page.keyboard.press('Escape');
   assert.ok(!(await page.locator('#theme-studio').isVisible()),'Esc did not close Theme Studio');
   await page.locator('#universe-instrument-trigger').click();
   for(const id of themeIds){
     await page.locator('[data-universe-select="'+id+'"]').click();
     assert.equal(await page.locator('html').getAttribute('data-universe'),id);
     await page.locator('#universe-instrument-trigger').click();
   }
   await page.locator('#theme-studio').screenshot({path:path.join(artifacts,'theme-studio-mobile.png')});
   await context.close();
  });
  await stage('No major browser JavaScript errors with reduced motion',async()=>{
   const context=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE,{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(900);
   assert.ok(!errors.length,'Browser script errors: '+errors.join(' | '));
   assert.equal(await page.locator('[data-universe-select]').count(),10);
   await context.close();
  });
 } finally {await browser.close();}
 if(failures.length){process.stderr.write('\n'+failures.length+' failed browser check(s):\n'+failures.join('\n')+'\n');process.exitCode=1;}
 else{process.stdout.write('\nAll '+(widths.length+2)+' browser checks passed.\n');}
})().catch(error=>{console.error(error);process.exitCode=1;});