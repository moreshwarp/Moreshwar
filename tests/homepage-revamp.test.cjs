// Homepage revamp (Nov 2026). Replaces the earlier tests that pinned the previous homepage layout,
// and keeps their intent: honest claims, working local links, one shared menu, no third-party requests.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const home=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('lab-home.css','utf8');
const js=fs.readFileSync('lab-home.js','utf8');

test('homepage states scope honestly and invents no affiliations',()=>{
  assert.match(home,/<h1 id="hello">/);
  assert.match(home,/independent research notebook/);
  assert.match(home,/not claims of peer-reviewed discoveries/);
  assert.match(home,/simulated/i,'the hero chart must say it is simulated');
  assert.doesNotMatch(home,/Associate Professor|PhD from|PhD student at|peer-reviewed papers by Moreshwar/);
});

test('homepage has the main sections and landmarks',()=>{
  for(const id of ['content','research-projects','experiments','writing','studying','about','about-profile'])assert.ok(home.includes('id="'+id+'"'),id);
  assert.match(home,/<a class="skip" href="#content">/);
  assert.equal((home.match(/<h1\b/g)||[]).length,1);
  assert.match(home,/<main id="content">/);
});

test('homepage menu matches the five links used on the other pages',()=>{
  const nav=home.match(/<nav class="[^"]*site-navigation[^"]*"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav);
  const links=[...nav.matchAll(/<a href="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(links,['index.html','studio.html','assets/machine-check/showcase.html','reading-archive.html','#about-profile']);
  assert.equal((nav.match(/aria-current="page"/g)||[]).length,1);
});

test('every local link and fragment on the homepage resolves',()=>{
  const ids=new Set([...home.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const [,url] of home.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(https?:|mailto:)/.test(url))continue;
    const [file,frag]=url.split('#');
    if(file)assert.ok(fs.existsSync(path.join('.',file.split('?')[0])),url);
    if(frag&&!file)assert.ok(ids.has(frag),url);
  }
});

test('fonts are self-hosted and no third-party requests are made',()=>{
  assert.doesNotMatch(home+css+js,/fonts\.googleapis|fonts\.gstatic|cdn\.|unpkg|jsdelivr/);
  for(const [,font] of css.matchAll(/url\((assets\/fonts\/[^)]+)\)/g))assert.ok(fs.existsSync(font),font);
});

test('theme is shared with other pages, mobile and motion preferences are handled',()=>{
  assert.match(js,/mrl-research-theme/);
  assert.match(home,/mrl-research-theme/);
  assert.match(css,/@media \(max-width:640px\)/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(js,/prefers-reduced-motion/);
  assert.match(css,/:focus-visible/);
});

test('build pipeline publishes the new homepage assets untouched',()=>{
  assert.match(fs.readFileSync('scripts/prepare-site.cjs','utf8'),/lab-home\.css lab-home\.js/);
  assert.match(fs.readFileSync('scripts/apply-text-mode.cjs','utf8'),/lab-home\.css/);
});
