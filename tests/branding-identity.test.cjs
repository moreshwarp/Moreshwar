'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {brandPublishedHtml,PUBLIC_BRAND,stylePage}=require('../scripts/apply-text-mode.cjs');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('source research pages use the selected public identity consistently',()=>{
 for(const file of ['index.html','studio.html','reading-archive.html','paul-graham.html','paul-graham-makers-schedule.html','paul-graham-schlep-blindness.html']){
  const html=read(file);
  assert.match(html,/Moreshwar <span>Systems Lab<\/span>/,file);
  assert.doesNotMatch(html,/Moreshwar Research Lab|Moreshwar \/ Lab/,file);
 }
});
test('shared navigation, generated reader templates and social SVG use Systems Lab',()=>{
 assert.equal(PUBLIC_BRAND,'Moreshwar Systems Lab');
 assert.match(read('shared-navigation.js'),/Systems Lab<\/small>/);
 assert.match(read('scripts/build-content.cjs'),/Moreshwar Systems Lab<\/title>/);
 assert.match(read('social-preview.svg'),/>SYSTEMS LAB<\/text>/);
});
test('publication normalizes legacy titles and labels but preserves author bylines',()=>{
 const html='<html><head><title>Note — Moreshwar / Lab</title></head><body><header>Moreshwar Research Lab</header><main><article>Written by Moreshwar Pidadi.</article></main><footer>m. / LAB</footer></body></html>';
 const next=brandPublishedHtml(html);
 assert.match(next,/<title>Note — Moreshwar Systems Lab<\/title>/);
 assert.match(next,/<header>Moreshwar Systems Lab<\/header>/);
 assert.match(next,/<footer>Moreshwar Systems Lab<\/footer>/);
 assert.match(next,/Written by Moreshwar Pidadi/);
 assert.equal(brandPublishedHtml(next),next);
});
test('old article title is rebranded at publication time and reader CSS stays linked',()=>{
 const html=stylePage('<html><head><title>Queues — Moreshwar Pidadi</title></head><body><main><article>Original text</article></main></body></html>','articles/test.html','q123');
 assert.match(html,/<title>Queues — Moreshwar Systems Lab<\/title>/);
 assert.match(html,/\.\.\/text-first-site\.css\?v=q123/);
 assert.match(html,/Original text/);
});
