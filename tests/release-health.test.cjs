const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {stampHtml}=require('../scripts/release-health.cjs');
const pages=fs.readFileSync(path.join(__dirname,'../.github/workflows/pages.yml'),'utf8');
const sha='0123456789abcdef0123456789abcdef01234567';

test('release stamping identifies exactly which merge is publicly served',()=>{
 const original='<!doctype html><html><head><title>Lab</title></head><body>Research</body></html>';
 const stamped=stampHtml(original,sha);
 assert.match(stamped,/name="mrl-release-sha" content="0123456789abcdef0123456789abcdef01234567"/);
 assert.equal(stamped.split('name="mrl-release-sha"').length-1,1);
 assert.equal(stampHtml(stamped,sha).split('name="mrl-release-sha"').length-1,1);
 assert.throws(()=>stampHtml(original,'bad-sha'));
 assert.throws(()=>stampHtml('<div>Missing head</div>',sha));
});

test('automatic Pages deployment verifies the public commit and core sharing assets',()=>{
 assert.match(pages,/node scripts\/release-health\.cjs stamp _site/);
 assert.match(pages,/node scripts\/release-health\.cjs verify/);
 assert.match(pages,/PAGE_URL: \$\{\{ steps\.deployment\.outputs\.page_url \}\}/);
 assert.ok(pages.indexOf('release-health.cjs stamp')<pages.indexOf('actions/upload-pages-artifact@v3'));
 assert.ok(pages.indexOf('release-health.cjs verify')>pages.indexOf('actions/deploy-pages@v4'));
 const code=fs.readFileSync(path.join(__dirname,'../scripts/release-health.cjs'),'utf8');
 for(const asset of ['social-preview.png','favicon.svg','atelier.css','mobile-first.css','research-method.svg'])
  assert.ok(code.includes(asset),asset);
});
