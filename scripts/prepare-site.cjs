/* Single allowlisted artifact builder shared by production and browser QA.
 * Source files are read-only. The output is recreated in GitHub Actions. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sourceFiles = "index.html styles.css discovery.css discovery.js design-system.css research-reader.css redesign.css app.js lab.css lab.js experience.css contact.js visual-theme.css mobile-fix.css universe.css visual.js reader-theme.css publisher.css inquiry.css inquiry.js science-ideas.css science-ideas.js editorial.css reader-feedback.css reader-feedback.js config.js substack-posts.json message-received.html bookshelf.json studio.html reading-archive.html editorial-style-guide.html editorial-design-system.css unified-site.css mrl-reboot.css atelier.css mobile-first.css mobile-first.js atlas-edition.css idea-observatory.css idea-observatory.js edition.css edition.js research-profile.css research-ux.css research-ux.js shared-navigation.css shared-navigation.js academic-journal.css scholarly-layout.css heritage-unified.css heritage-unified.js text-first-site.css favicon.svg social-preview.svg social-preview.png research-method.svg classic.html".split(' ');
const requiredFiles = [
  'index.html', 'studio.html', 'reading-archive.html', 'classic.html',
  'bookshelf.json', 'unified-site.css', 'mrl-reboot.css', 'atelier.css',
  'mobile-first.css', 'mobile-first.js', 'atlas-edition.css', 'idea-observatory.css', 'idea-observatory.js', 'edition.css', 'edition.js', 'research-profile.css', 'research-ux.css', 'research-ux.js', 'shared-navigation.css', 'shared-navigation.js', 'academic-journal.css', 'scholarly-layout.css', 'heritage-unified.css', 'heritage-unified.js', 'text-first-site.css', 'favicon.svg',
  'social-preview.png', 'research-method.svg'
];

function prepareSite(destination = '_site') {
  const output = path.resolve(destination);
  if (output === root || output === path.parse(output).root) {
    throw new Error('Refusing to overwrite the repository or filesystem root');
  }
  fs.mkdirSync(output, { recursive: true });
  for (const filename of sourceFiles) {
    fs.copyFileSync(path.join(root, filename), path.join(output, filename));
  }
  for (const dirname of ['assets', 'articles', 'vendor']) {
    fs.cpSync(path.join(root, dirname), path.join(output, dirname), {
      recursive: true, force: true
    });
  }
  fs.mkdirSync(path.join(output, 'data'), { recursive: true });
  fs.copyFileSync(path.join(root, 'data/science-cabinet.json'),
    path.join(output, 'data/science-cabinet.json'));
  fs.writeFileSync(path.join(output, '.nojekyll'), '');
  for (const filename of requiredFiles) {
    if (!fs.statSync(path.join(output, filename)).size) {
      throw new Error('Missing or empty published asset: ' + filename);
    }
  }
  console.log('Prepared ' + sourceFiles.length + ' shared files and article/assets directories');
  return output;
}

if (require.main === module) prepareSite(process.argv[2] || '_site');
module.exports = { sourceFiles, requiredFiles, prepareSite };
