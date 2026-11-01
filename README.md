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

**Automatic, test-gated production:** A push or merged PR to `main` starts `.github/workflows/pages.yml`. It calls the existing portfolio-quality and Playwright/browser QA workflows as required jobs. The Pages deployment only runs after **both** pass. Pull requests use those same quality workflows without duplicating their execution on every `main` push.

**One build manifest:** `scripts/prepare-site.cjs` provides the same verified file list to browser QA and production. It ships the essays, bookshelf, social PNG, favicon, research diagrams and necessary styles/scripts. Do not maintain separate file-copy lists in YAML. The production pipeline then synchronizes issue-based reader discussions, builds owner-published content, verifies the catalog, and publishes `_site`.

**Live verification:** After publishing, `scripts/release-health.cjs` verifies the publicly served homepage contains the exact merge SHA and that the PNG preview, favicon, diagrams and styles actually load. A failed smoke check reports a failed deployment workflow, even if the Pages deployment action succeeded.

**Required repository setting:** GitHub **Settings → Pages → Build and deployment → Source** must be **GitHub Actions**. The workflow cannot change this account-level setting. Verify production status in the [Pages workflow history](https://github.com/moreshwarp/Moreshwar/actions/workflows/pages.yml).

Run local regression tests:

```sh
node --test tests/*.test.cjs
```

Prepare a local publish artifact:

```sh
node scripts/prepare-site.cjs _site
node scripts/build-content.cjs _site
python3 scripts/build_catalog.py --output _site/data/research-catalog.json
```

Playwright/browser QA tests the actual prepared site at mobile and desktop widths. The public website does not require a JavaScript framework or browser-side secrets.

## Existing original content and attribution

Imported Substack articles remain identified as such and retain their original article URLs under \`articles/\`. The three educational systems fieldnotes explicitly disclose AI assistance. No fieldnotes are presented as peer-reviewed publications or novel experimentally verified work.

## Release notes

Previous prototype documentation described visitor-selectable themes and a local draft popup. These have been retired. The current site intentionally has one **publisher-owned appearance** and a separate **GitHub-authorized editing process**. See [ADMIN_GUIDE.md](ADMIN_GUIDE.md) for the updated process.

## GitHub Pages source mode

**Use Settings → Pages → Source: GitHub Actions**, not Deploy from a branch. The source HTML now has complete fallback editorial content to avoid empty sections, but the real CMS publishing pipeline requires the custom build in `.github/workflows/pages.yml`. See [ADMIN_GUIDE.md](ADMIN_GUIDE.md).


## Inquiry Engine — first executable research exercise

The homepage's [Inquiry Engine](https://moreshwarp.github.io/Moreshwar/#inquiry) offers four transparent investigation protocols around fan-out/tail latency, consistency after failover, machine-learning evaluation, and safe rich-text rendering. Each protocol displays:

- a question and falsifiable hypothesis;
- a limitation or counterexample that could weaken it;
- the next concrete, verifiable experiment;
- a relevant existing essay or credible public technical reference.

The first protocol includes a **live probability calculator** for the mathematical model \(P(\geq1\text{ slow downstream})=1-(1-p)^n\), assuming independent requests. It is *not* production telemetry or a latency benchmark. All results are calculated in the visitor's browser; no data is uploaded. Source: \`inquiry.js\`, \`inquiry.css\`; rigorous limitations: [RESEARCH_METHOD.md](RESEARCH_METHOD.md). Unit tests include probability bounds and falsification/label checks; the Chromium workflow tests mobile interaction and rendering.

The Inquiry Engine is deliberately a **research starting point**, not a fictional project portfolio or peer-reviewed result. The goal is to build a body of evidence over time.

## Science & Ideas (2026)

The public `#science-ideas` section offers a verified, English-language listening shelf covering the US, India and Google DeepMind, plus 8 rotating thinker-inspired *paraphrased* insights and 3 Nobel 2026 science stories with educational backgrounds. Every item links to a source. Source data lives in `data/science-cabinet.json`; the client script `science-ideas.js` rotates the daily thought and supports region filtering, while `science-ideas.css` renders responsive cards. Original fallback HTML is included to keep the material visible if JSON loading fails. `reviewedOn` identifies when facts were last checked, not a live Nobel update.

Podcasts and story choices are curated leads, not claims of personal relationships or achievements. Where training details belong to one co-laureate, that distinction is explicit.

### Research discovery pipeline (Python + Go)

Python builds `data/research-catalog.json` from published essays and curated podcast sources. Drafts are excluded, article paths must resolve inside `articles/`, and source links must use HTTPS. The browser's discovery panel searches this generated catalog locally; there is no visitor tracking or server requirement.

Go provides an independent publication guard for catalog counts, duplicate IDs, local article existence, path traversal, symlink escape and unsafe source URLs. Pages runs the guard against the prepared publishing directory before uploading it. No third-party Python or Go packages are required.

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/build_catalog.py
go test ./...
go run ./tools/catalogcheck .
```

For a publishing fixture, pass `--output _site/data/research-catalog.json` to the Python builder and `_site` to the Go guard. Keep the generated catalog out of source control; edit the original posts and curated source data.
