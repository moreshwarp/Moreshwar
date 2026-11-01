/* GitHub Pages release identity and production smoke verification.
 * Never reports a deployment as healthy until the exact commit and public assets are served. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const marker=sha=>'<meta name="mrl-release-sha" content="'+sha+'">';

function stampHtml(html,sha){
 if(!/^[0-9a-f]{40}$/.test(sha))throw Error('Invalid release commit SHA');
 if(!html.includes('</head>'))throw Error('Cannot stamp page without </head>');
 return html.replace(/<meta name="mrl-release-sha" content="[0-9a-f]{40}">\s*/g,'')
   .replace('</head>',marker(sha)+'\n</head>');
}

async function fetchChecked(url){
 const response=await fetch(url,{redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error(url+' returned HTTP '+response.status);
 return response;
}

async function verifyProduction(baseUrl,sha){
 if(!baseUrl||!baseUrl.startsWith('https://'))throw Error('Missing HTTPS Pages deployment URL');
 if(!/^[0-9a-f]{40}$/.test(sha))throw Error('Invalid release SHA');
 const base=new URL(baseUrl);
 if(!base.pathname.endsWith('/'))base.pathname+='/';
 let lastError;
 for(let attempt=1;attempt<=12;attempt++){
  try{
   const page=await fetchChecked(new URL('?mrl-release='+sha,base));
   const html=await page.text();
   assert.ok(html.includes(marker(sha)),'Production is not serving the requested commit');
   const social=await fetchChecked(new URL('social-preview.png?mrl-release='+sha,base));
   const png=Buffer.from(await social.arrayBuffer());
   assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','WhatsApp PNG not published');
   for(const asset of ['favicon.svg','mrl-reboot.css','atelier.css','mobile-first.css','mobile-first.js','research-method.svg']){
    const response=await fetchChecked(new URL(asset+'?mrl-release='+sha,base));
    const data=await response.arrayBuffer();
    assert.ok(data.byteLength>100,'Empty public asset: '+asset);
   }
   console.log('PRODUCTION VERIFIED: '+base.href+' is serving '+sha+' with social and UI assets.');
   return;
  }catch(error){
   lastError=error;
   console.warn('Production check '+attempt+'/12: '+error.message);
   if(attempt<12)await new Promise(resolve=>setTimeout(resolve,10000));
  }
 }
 throw Error('Deployed revision not verified after retries: '+lastError.message);
}

async function run(){
 const [mode,arg]=process.argv.slice(2);
 const sha=process.env.GITHUB_SHA;
 if(mode==='stamp'){
  const dir=path.resolve(arg||'_site');
  const index=path.join(dir,'index.html');
  fs.writeFileSync(index,stampHtml(fs.readFileSync(index,'utf8'),sha));
  console.log('Stamped release identity '+sha);
 }else if(mode==='verify'){
  await verifyProduction(process.env.PAGE_URL,sha);
 }else throw Error('Usage: node scripts/release-health.cjs stamp [_site] | verify');
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
module.exports={stampHtml,verifyProduction};
