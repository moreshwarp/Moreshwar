'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const css=read('research-site.css');
const reader=read('text-first-site.css');
const pages=['index.html','studio.html','reading-archive.html','paul-graham.html'];
function luminance(hex){
  const rgb=hex.match(/[a-f0-9]{2}/gi).slice(0,3).map(ch=>parseInt(ch,16)/255);
  return rgb.map(n=>n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4)).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
}
function contrast(a,b){
  const l1=luminance(a),l2=luminance(b);
  return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
}
test('research pages share one semantic typographic system and four navigation tabs',()=>{
  assert.match(css,/--type-editorial:/);
  assert.match(css,/--type-ui:/);
  assert.match(css,/--paper:#ffffff/);
  assert.match(css,/--paper:#111111/);
  assert.match(css,/--link:#8c4558/);
  assert.match(css,/--link:#e4afbd/);
  for(const file of pages){
    const html=read(file);
    assert.match(html,/href="research-site\.css"/);
    assert.match(html,/id="theme-toggle"/);
    const nav=html.match(/<nav class="site-navigation"[\s\S]*?<\/nav>/);
    assert.ok(nav,'missing navigation in '+file);
    assert.deepEqual([...nav[0].matchAll(/<a [^>]*>([^<]+)<\/a>/g)].map(m=>m[1]),['Home','Research','Writing','About'],file);
  }
});
test('maroon links pass minimum normal-text contrast in both modes',()=>{
  assert.ok(contrast('#8c4558','#ffffff')>=4.5);
  assert.ok(contrast('#e4afbd','#111111')>=4.5);
});
test('research and article styles remain text-first without external font downloads',()=>{
  assert.doesNotMatch(css,/@import|fonts\.googleapis|url\(.*\.woff/i);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/@media\(max-width:780px\)/);
  assert.match(reader,/November 2026 editorial alignment/);
  assert.match(reader,/--editorial-face:/);
  assert.match(reader,/--site-link:#8c4558/);
  assert.match(reader,/body\.mrl-article-page :is\(h1\)/);
});
