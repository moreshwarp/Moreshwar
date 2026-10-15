# Moreshwar / Lab — Current Use Cases, Test Cases and Acceptance Criteria

Release: **owner-controlled publisher architecture** (supersedes older visitor-selectable themes and local-only editors).
Public URL: **https://moreshwarp.github.io/Moreshwar/**

## System boundaries

1. Public GitHub Pages: **read-only** HTML/CSS/JS, scientific simulations, essay archive, curated recommendations, comment previews.
2. GitHub-authorized Pages CMS: owner/editor UI; GitHub repository permissions gate writes.
3. GitHub Actions: takes approved Markdown in \`content/posts\`, theme in \`data/site-settings.json\`, and curated items in \`data/recommendations.json\`; generates \`_site\` HTML.
4. GitHub Issues: comments, reactions, identity and moderation for article discussions.
5. FormSubmit: external provider for contact email; delivery needs separate activation.

**Security boundary:** never rely on an invisible public editor button, client-side admin password, localStorage permission, or browser source obfuscation. GitHub controls write permissions. Public GitHub repository source, including unpublished Markdown drafts, is readable.

## Test environment and commands

- Node 22; \`node --test tests/*.test.cjs\` for automated unit/structural checks.
- GitHub Actions \`Portfolio quality checks\` on pushes and pull requests.
- GitHub Actions \`Mobile and Theme Browser QA\` runs Chromium at real phone/tablet/desktop widths.
- \`Deploy Moreshwar / Lab\` creates and publishes the actual GitHub Pages artifact.

## Use cases and detailed acceptance scenarios

| ID | Actor | Action or condition | Expected outcome | Test method |
|---|---|---|---|---|
| PUB-01 | Visitor | Open homepage | Published research homepage is visible; no editor, admin sign-in or theme-changing controls | Browser automated |
| PUB-02 | Visitor | Open narrow phone at 320px | Navigation and scientific diagram stay inside viewport | Browser automated |
| PUB-03 | Visitor | Open at 360, 390, 430, 768, 1024, 1440px | No horizontal page overflow; Current Lens remains readable | Browser automated |
| PUB-04 | Visitor | Switch Systems, AI/ML, Frontend lenses | Technical focus explanation changes; public theme does not | Browser automated |
| PUB-05 | Visitor | Set old localStorage theme then reload | Owner's saved theme still applies | Browser automated |
| PUB-06 | Visitor | Navigate to any of 25 existing essays | Same owner-defined brightness/theme applies | Browser automated + manual sampling |
| PUB-07 | Visitor | Enable reduced motion | Moving decoration stops; content remains readable | CSS test + manual |
| PUB-08 | Visitor | Use search, Work, Research, Writing, Library, Picks | Navigation anchors and content remain functional | Manual |
| AUTH-01 | Visitor | Look for admin editor on website | No public admin editor or CMS login is present | Automated |
| AUTH-02 | Visitor | Attempt to publish using only browser DevTools | No writable client-side endpoint or GitHub credential exposed | Code review |
| AUTH-03 | Visitor | Try to change appearance via URL or localStorage | Public theme remains owner-published | Browser automated |
| AUTH-04 | Owner | Sign in to Pages CMS using GitHub | Repo appears only after owner authorizes Pages CMS App | Manual external-provider setup |
| AUTH-05 | Owner | Open editor from authorized Pages CMS | Rich-text fields load for markdown posts | Manual CMS acceptance |
| AUTH-06 | Unauthorized GitHub user | Attempt write to repository | GitHub denies commit/publish due missing permission | Manual GitHub permission check |
| AUTH-07 | Owner | Change global universe to noir and save | GitHub Action deploys noir across homepage and essays | Manual owner release test |
| AUTH-08 | Owner | Change brightness to light | Same published light theme displays for every visitor | Manual owner release test |
| AUTH-09 | Owner | Select a theme not in whitelist | Build rejects invalid appearance rather than deploy unsafe JS | Unit test |
| CMS-01 | Owner | Create an unpublished Markdown article | Entry is excluded from hosted Pages and homepage | Unit/build test |
| CMS-02 | Owner | Save an unpublished article | File exists in public GitHub source; owner is warned it is not confidential | Documentation/manual |
| CMS-03 | Owner | Set published true and commit | GitHub Pages generates \`articles/notes-*.html\` | Manual end-to-end release test |
| CMS-04 | Owner | Write headings/lists/bold/code/links | Renderer emits readable semantic HTML | Unit |
| CMS-05 | Owner | Insert a Markdown image | Allowlisted HTTP(S) or site media image renders responsively | Unit + manual |
| CMS-06 | Owner | Insert raw script/HTML | Renderer escapes content; script never executes | Unit |
| CMS-07 | Owner | Use javascript: links | Renderer rejects unsafe link | Unit |
| CMS-08 | Owner | Publish a new article | Article appears in “New from the Editorial Notebook” | Manual end-to-end |
| CMS-09 | Owner | Publish twice with same filename | Same generated page updates without duplicates | Build logic review/manual |
| CMS-10 | Owner | Change title/date/summary | New metadata renders without replacing original Substack articles | Manual |
| CMS-11 | Owner | Edit source Markdown from GitHub | The same publishing workflow runs without requiring CMS UI | Manual |
| CMS-12 | Owner | Submit invalid frontmatter | Invalid settings/build do not reach production | Unit/action |
| READER-01 | Visitor | Read any of 22 imported Substack posts | Complete article page preserved | Automated count |
| READER-02 | Visitor | Open three AI-assisted fieldnotes | Disclosures are preserved | Automated + manual |
| READER-03 | Visitor | Open a new published owner article | Title/byline/date and formatted article body appear | Manual end-to-end |
| FEED-01 | Visitor | Open imported article | Dedicated Github Issue thread is linked | Automated |
| FEED-02 | Visitor | View an article with existing comments | Latest public comments appear safely on site | Mocked browser integration |
| FEED-03 | Visitor | Click Like on GitHub | Correct article issue opens for authenticated reaction | Browser automated |
| FEED-04 | Visitor | Click Write a comment | Correct article issue opens; GitHub login is required to submit | Browser automated/manual |
| FEED-05 | Visitor | Refresh after a reaction | GitHub-backed count refreshes (subject to API caching) | Manual external service |
| FEED-06 | Visitor | GitHub API rate-limited/offline | Site shows fallback explanation and working issue link | Code review/manual |
| FEED-07 | Visitor | Comment contains script-like HTML | Embedded comment uses textContent; no script execution | Browser automated |
| FEED-08 | Owner | Publish new article | Issue is created once; subsequent deploy reuses it | GitHub Actions logic/manual |
| FEED-09 | Owner | Moderate a thread | Github Issue moderation applies publicly | Manual |
| FEED-10 | User | Try to like without GitHub sign-in | GitHub requests login; no fake local-only like is counted | Manual |
| PICKS-01 | Visitor | Open Picks under Science Lab | One Movie, Book, Article and YouTube lead display | Unit/build/browser |
| PICKS-02 | Owner | Select different universe and deploy | Published four-pick selection matches owner's theme | Unit/manually change |
| PICKS-03 | Owner | Leave approved false | Card says Curated Lead, not personally recommended | Automated |
| PICKS-04 | Owner | Set approved true after personal review | Card says Personally Recommended | Unit |
| PICKS-05 | Visitor | Follow YouTube/item card | Trusted HTTPS destination opens in new tab | Unit |
| PICKS-06 | Owner | Enter javascript: recommendation URL | Unsafe card link is dropped | Unit |
| MOBILE-01 | Visitor | Mobile portrait at 320–430px | Home, lens status, Picks, cards, discussions fit screen | Chromium QA |
| MOBILE-02 | Visitor | Tablet 768px | Cards reflow correctly and navigation remains usable | Chromium QA |
| MOBILE-03 | Visitor | Desktop at 1440px | Scientific imagery and recommendation grid balance across columns | Chromium QA + visual review |
| CONTACT-01 | Visitor | Valid enquiry | Normal browser POST to FormSubmit | Existing automated tests |
| CONTACT-02 | Visitor | Invalid email | Input validation blocks submission | Existing automated tests |
| CONTACT-03 | Owner | Complete FormSubmit activation, receive email | Gmail inbox contains message and reply address | Manual; activation outstanding |
| DEPLOY-01 | CI | Push content/appearance change to main | Static build and Pages deployment complete | GitHub Actions |
| DEPLOY-02 | CI | Execute \`node --test tests/*.test.cjs\` | All tests pass | GitHub Actions |
| DEPLOY-03 | CI | Execute browser QA | Screenshots and geometry pass on configured viewports | GitHub Actions |
| DEPLOY-04 | CI | Try to publish while renderer fails | Deployment fails rather than ship broken pages | Build exception guard |
| DEPLOY-05 | QA | Compare public URL after deployment | New artifacts visible after refresh and unchanged URL case | Manual |

### Scope and known limitations

- The third-party rich-text editor requires the owner to **connect Pages CMS** and grant GitHub repository access. This is a user-authorization step, not something committed code can bypass.
- No public page contains a functional private admin login. GitHub write permissions protect content changes.
- **Drafts in this public GitHub repository are not confidential**, even if not hosted.
- Reader reactions/comments are genuinely stored in GitHub Issues. Visitors sign into GitHub to write; the website displays the discussion and tallies. Fully inline anonymous comments require a separately deployed backend and moderation system.
- The current 40 movie/book/article/video records are **curated leads**, not verified personal recommendations until approved by the owner.
- The contact email provider remains separate and must be tested after activation.
