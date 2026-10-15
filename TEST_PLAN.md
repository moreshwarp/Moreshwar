# Moreshwar / Lab — QA, Test Plan & Project Walkthrough

## Project objective

A publicly hosted, responsive academic-engineering portfolio that demonstrates systems thinking with interactive models and original reading notes, preserves imported publications, curates references, and receives visitor enquiries through a third-party email service.

### Modules under test
- Homepage, research atlas, and three interactive systems models
- Writing collection: 22 imported Substack articles + three clearly disclosed AI-assisted systems drafts
- Book / paper / article / course catalog, search and filters
- Contact interface: semantic HTML validation, prompts, preview, native POST, FormSubmit redirect, fallback email link
- GitHub Pages deployment at the case-sensitive path **/Moreshwar/**

## Automated regression suite

Command: \`node --test tests/site.test.cjs\`

GitHub Actions workflow: \`.github/workflows/quality.yml\` (runs on pushes and pull requests to main). No extra npm dependencies. The suite verifies page structure, JS validation, required publication content, category coverage, cross-module paths and motion accessibility.

## Manual acceptance cases

| ID | Scenario | Action | Expected result | Verification |
|---|---|---|---|---|
| UI-01 | Desktop navigation | Open root and use Work, Research, Writing, Library | Anchor navigation works; no clipped sections | Manual |
| UI-02 | Mobile navigation | Open at width 390px; navigate and rotate | No horizontal overflow; menu functional | Manual |
| UI-03 | Reduced motion | Enable OS reduced-motion setting | Animated effects pause or stop without hiding content | Manual |
| LAB-01 | Tail fan-out | Change dependencies 1 → 48 | Probability follows \`1 - (1-p)^n\` | Math + manual |
| LAB-02 | Tail slow probability | Set 1% then 30% | Probability increases for fixed n | Math + manual |
| LAB-03 | Queue model | Set arrival 10 with service 20 | Expected mean response = 100 ms | Math + manual |
| LAB-04 | Queue overload | Set arrival 21 with service 20 | UI explicitly says no stationary finite mean | Math + manual |
| LAB-05 | Replica staleness | Write on A twice before deliver | B remains behind; lag visible | Manual |
| LAB-06 | Partition | Pause link, write, try deliver | Delivery unavailable while partitioned | Manual |
| LAB-07 | Recovery | Restore link and deliver | Replica catches up; status in sync | Manual |
| LIB-01 | Paper filter | Select Papers | Real suggested papers display, not empty state | Manual |
| LIB-02 | Course filter | Select Courses | Curated course entries display | Manual |
| LIB-03 | No-match search | Search nonsense phrase | Styled empty panel offers reset | Manual |
| LIB-04 | Reset search | Click Explore all references | Filters and search reset to all | Manual |
| WR-01 | Original posts | Open Writing | All 22 original Substack posts present | Automated |
| WR-02 | Reading page | Open an imported article | Full article opens at relative path | Manual |
| WR-03 | Systems draft | Open one of three new research notes | Clearly discloses AI assistance and model limitations | Automated + manual |
| FORM-01 | Valid submission | Fill name, valid email and message | Native POST navigates to FormSubmit (not AJAX) | Automated structure + manual |
| FORM-02 | Invalid name | Enter one character | Browser prevents submission, field feedback visible | Unit + manual |
| FORM-03 | Invalid email | Enter a malformed address | Browser prevents submission | Unit + manual |
| FORM-04 | Short message | Enter two-character message | Validation accepts the message | Unit + manual |
| FORM-05 | Topic prompts | Click Research idea | Topic and sample draft populate; message is editable | Manual |
| FORM-06 | Provider activation | First submit to unactivated email | Provider requires owner to verify delivery in Gmail | E2E pending activation |
| FORM-07 | Confirmation | Submit after activation and service acceptance | Provider redirects to \`message-received.html\` | E2E pending activation |
| FORM-08 | Gmail inbox | Send a real test, then search recipient Gmail | Received notification includes name, email, topic, message | E2E pending activation |
| FORM-09 | Email backup | Click direct email alternative | System mail application opens with recipient prefilled | Manual |
| SEC-01 | Escaping | Enter markup in name/message | It appears as untrusted text in native form submission, not innerHTML | Code review |
| SEC-02 | Spam field | Fill honeypot automatically as a bot | Provider can block spam-like submissions | Provider behavior (not locally verified) |
| SEC-03 | No secrets | Inspect public JavaScript and HTML | No Gmail password or Resend secret in client source | Automated/code review |
| PERF-01 | Page responsiveness | Inspect desktop and mobile network performance | Site readable before Three.js effect, no expensive blocking page load | Manual profiling |

## End-to-end email prerequisites — important

GitHub Pages cannot itself receive form data or deliver Gmail messages. This project uses FormSubmit, a separate third-party processor. The recipient **must activate the form by confirming the provider's email**. Live delivery cannot be guaranteed from static-code or unit tests, and the provider's redirect only proves processing of the form submission, not receipt in Gmail. The website never publishes visitors' private messages publicly.

Until activation is confirmed, consider the contact feature **partially configured**, not production-verified. Form submissions share personally supplied name, reply email, and message with FormSubmit; the site tells visitors this before sending. Prefer a first-party backend when stronger delivery guarantees, spam controls, retention policies or an owner-managed message dashboard are needed.

## Demo / technical walkthrough

1. Show the interactive Research Atlas and distinguish engineering practice from active learning.
2. Use Tail Lab to demonstrate the independence-based probability model.
3. Use Queueing Lab to discuss utilization and model breakdown at saturation.
4. Use Replica Lab to illustrate stale reads without claiming the simulation implements consensus.
5. Navigate from experiments to the three explanatory AI-assisted research notes and references.
6. Open original Substack archive and curated research library.
7. Demonstrate form field validation and provider redirect **without exposing test visitor information on screen**.
8. Open GitHub Actions to show passing unit checks and the successful Pages deployment.

## Release checklist

- Automated tests pass.
- GitHub Pages custom workflow succeeds.
- Navigate to \`https://moreshwarp.github.io/Moreshwar/\`; note the repository path is case-sensitive.
- Verify sample articles and the library categories are still present.
- Do not claim Gmail delivery until an actual recipient mailbox test succeeds.
- Do not present the educational labs as recorded performance benchmarks or the AI-assisted notes as peer-reviewed publications.


## Visual Research Interface v6 — use cases and acceptance matrix

The home page has a built-in SVG research visualization that must work without WebGL, external CDNs, JavaScript, or network calls. The left column of the Engineering Atlas contains an illustrative architecture map. Neither graphic claims benchmark data.

| ID | Use case or test | Procedure | Expected result | Automation |
|---|---|---|---|---|
| VIS-01 | Hero no-overlap, desktop | Open homepage at 1920×1080, 1440×900, 1280×800 | Headline and figure remain distinct, both have breathing room; no horizontal overflow | Static layout rule + manual visual |
| VIS-02 | Hero tablet | Width 960–1200px | Figure still visible and headline does not obscure it | CSS coverage + manual |
| VIS-03 | Hero mobile | Width 390px and 320px | Graphic stacks below copy; tabs accessible and content scrollable | CSS coverage + manual |
| VIS-04 | Offline / no WebGL | Block all CDN scripts and disable WebGL | SVG figure is still visible because it is HTML markup | Automated structural check + manual |
| VIS-05 | Scientific diagram modes | Click Systems, AI/ML and Frontend tabs | Figure focus label and active state change | Simulated JS interaction |
| VIS-06 | Keyboard figure controls | Tab to a lens, press left/right arrow | Next/previous lens activates and receives focus | Simulated JS interaction |
| VIS-07 | Stop motion | Enable OS reduced motion; use site's motion toggle | Pulsing/rotation animations stop, SVG labels remain visible | CSS checks + manual |
| VIS-08 | Hidden tab | Switch browser tab away from site | Diagram animation pauses when document is hidden | Unit + manual |
| ATLAS-01 | No blank header | Scroll to Engineering Atlas | Left architecture graphic balances right title block | Automated structural + visual |
| ATLAS-02 | Technology filters | Choose Frontend, AI/ML, Backend, Systems | Only matching cards appear; count/ARIA update | Existing JavaScript + manual |
| ATLAS-03 | Card details | Click each domain | Modal opens with topic-specific engineering explanation | Manual |
| THEME-01 | System preference light | Clear saved theme, set OS light, refresh | Site loads light and theme button offers Dark | Pure unit + manual |
| THEME-02 | System preference dark | Clear saved theme, set OS dark, refresh | Site loads dark and theme button offers Light | Pure unit + manual |
| THEME-03 | Manual toggle | Press theme button | Color scheme, label, ARIA state and browser chrome color update | Simulated JS unit + manual |
| THEME-04 | Persist across navigation | Pick light, open an article and return | Both article and homepage remain light | Static coverage + manual |
| THEME-05 | Article theme coverage | Open each of 22 imported posts and 3 fieldnotes | All 25 pages offer a theme toggle and legible colors | Automated |
| THEME-06 | Keyboard & focus | Navigate to theme control with Tab | Visible focus indicator; Enter/Space changes theme | Native button + manual |
| THEME-07 | Light-mode legibility | Inspect work cards, library, contact, dialogs, footer | Text/background colors remain readable; links distinguishable | Manual visual |
| THEME-08 | Theme without storage | Block localStorage and load page | No crash; theme defaults safely | Pure unit + manual |
| PRESERVE-01 | Articles untouched | Open published archive and count article URLs | All 22 Substack articles remain linked | Automated |
| PRESERVE-02 | Research labs untouched | Run latency, queue and replica models | Existing three models still interactive | Automated presence + manual |
| PRESERVE-03 | Contact + library | Open and use both sections | Forms and reference filters still function | Existing automated checks + manual |
| DEPLOY-01 | Correct GitHub Pages artifact | Inspect deploy workflow | New CSS and JS, existing assets and all articles included | Automated |
| DEPLOY-02 | Full automated suite | Run \`node --test tests/*.test.cjs\` | 0 failures; all suites green | GitHub Actions |
| DEPLOY-03 | Publish | Watch GitHub Actions Pages workflow | GitHub reports successful deployment | GitHub Actions |
| DEPLOY-04 | Public URL | Visit \`https://moreshwarp.github.io/Moreshwar/\` in fresh browser | Correct main content and toggle assets load | Manual public browser |

This is a static research portfolio. The scientific images are diagrams of technical interests, **not real observed telemetry**. Light and dark preference is stored only in local browser storage. Email delivery is still a separate service that needs its own activation and an end-to-end inbox test.
