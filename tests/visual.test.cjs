// Responsive scientific graphics and owner-only settings.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
const html=read('classic.html'),mobile=read('mobile-fix.css'),visual=read('visual-theme.css'),lens=read('visual.js');
test('scientific instrument remains visible and interactive',()=>{
 assert.match(html,/class="instrument-svg"/);assert.match(html,/id="instrument-surface"/);
 assert.match(html,/id="instrument-focus-title"/);assert.match(lens,/ArrowRight/);
 for(const id of ['systems','ai','frontend'])assert.match(html,new RegExp('data-instrument-mode="'+id+'"'));
});
test('phone repair places Current Lens below the SVG',()=>{
 assert.match(mobile,/flex-direction:column/);
 assert.match(mobile,/\.instrument-focus[\s\S]*?position:relative/);
 assert.match(mobile,/@media\(max-width:430px\)/);
 assert.match(mobile,/overflow-wrap:anywhere/);
});
test('large and small viewport rules with reduced motion',()=>{
 for(const size of [1200,960,720,420])assert.ok(visual.includes('@media(max-width:'+size+'px)'));
 assert.match(visual,/prefers-reduced-motion:reduce/);
});
test('owner theme file replaces visitor-selected theme',()=>{
 assert.match(html,/site-settings\.js/);
 assert.doesNotMatch(html,/theme\.js\?v=viz-theme-/);
 assert.doesNotMatch(html,/universe\.js\?v=universe-studio-/);
});
test('original research/reading content survives',()=>{
 assert.equal((html.match(/<li><a href="articles\//g)||[]).length,22);
 assert.equal((html.match(/class="fieldnote-card"/g)||[]).length,3);
 assert.equal((html.match(/class="lab-panel /g)||[]).length,3);
});
test('reading pages get a single published theme during the GitHub Actions build',()=>{
 const engine=require('../scripts/build-content.cjs');
 const fixture='<html><head><script defer src="../theme.js?v=old"></script></head><body><main></main></body></html>';
 const output=engine.decorate(fixture,11);
 assert.match(output,/site-settings\.js/);
 assert.doesNotMatch(output,/theme\.js\?/);
 assert.match(output,/data-issue="11"/);
});
