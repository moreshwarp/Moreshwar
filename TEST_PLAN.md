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
