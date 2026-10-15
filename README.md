# Moreshwar / Lab

**Live site:** https://moreshwarp.github.io/Moreshwar/  
**Editor:** https://app.pagescms.org/ (GitHub login + explicit owner approval required)  
**Owner instructions:** [ADMIN_GUIDE.md](ADMIN_GUIDE.md)  
**Quality/test scenarios:** [TEST_PLAN.md](TEST_PLAN.md)

An independent research-oriented personal site, combining original Substack writing, systems-learning experiments, technical notes and an owner-published curation collection.

## Public visitor experience

- Six areas of engineering interests plus three interactive browser-based systems demonstrations.
- 22 existing Substack articles preserved in standalone reader pages.
- Three AI-assisted educational systems fieldnotes, disclosed as drafts rather than peer-reviewed research.
- New owner-published Markdown articles generated automatically under \`articles/notes-*.html\`.
- Read-only, consistent public visual atmosphere, using one of ten genre-inspired palettes.
- Film/book/article/YouTube recommendations matched to the owner-selected universe. Candidate items aren't claimed as personally endorsed.
- Recent reader comments and accurate reactions from each article's GitHub Issue; GitHub login required to post or react.
- Mobile responsive layout and reduced-motion support.
- Contact form backed by FormSubmit, pending owner activation/delivery verification.

## Authoring and security

Theme and brightness: \`data/site-settings.json\`.  
Recommendations: \`data/recommendations.json\`.  
Articles: \`content/posts/*.md\` with YAML frontmatter (\`published: true\` makes them public).  
Rich-text editing UI: hosted [Pages CMS](https://app.pagescms.org/) using GitHub OAuth/GitHub App; configured by \`.pages.yml\`.  
Static generator: \`scripts/build-content.cjs\`.  
Discussion sync: \`scripts/sync-feedback.cjs\`.  
Reader feedback UI: \`reader-feedback.js\` and \`reader-feedback.css\`.

The public site has **no editable CMS or theme controls**. GitHub repository permissions gate all publishing. Pages CMS cannot be used until the repository owner expressly authorizes its GitHub integration.

**Draft confidentiality:** Draft Markdown in a public GitHub repository is visible on GitHub even when \`published: false\` prevents public Pages generation. Do not put confidential research into this public repository.

## Deployment

The custom \`.github/workflows/pages.yml\` workflow copies the 25 existing readers, synchronizes issue-backed discussions, builds the published Markdown articles and curated theme, and deploys \`_site\` to GitHub Pages.

Run local unit regression checks:

\`\`\`sh
node --test tests/*.test.cjs
\`\`\`

Preview a publish build into a prepared directory containing \`index.html\` and \`articles/\`:

\`\`\`sh
node scripts/build-content.cjs _site
\`\`\`

For a fully copied artifact follow the Prepare site step in the GitHub Pages workflow.

A separate Playwright/Chromium GitHub Actions workflow performs screenshot and actual viewport geometry tests. No JavaScript framework or browser-side secret is required.

## Existing original content and attribution

Imported Substack articles remain identified as such and retain their original article URLs under \`articles/\`. The three educational systems fieldnotes explicitly disclose AI assistance. No fieldnotes are presented as peer-reviewed publications or novel experimentally verified work.

## Release notes

Previous prototype documentation described visitor-selectable themes and a local draft popup. These have been retired. The current site intentionally has one **publisher-owned appearance** and a separate **GitHub-authorized editing process**. See [ADMIN_GUIDE.md](ADMIN_GUIDE.md) for the updated process.
