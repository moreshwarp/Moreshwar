# Moreshwar / Lab — Owner Publishing Guide

**Public site:** https://moreshwarp.github.io/Moreshwar/  
**GitHub repository:** https://github.com/moreshwarp/Moreshwar  
**Private-to-your-account editing interface:** https://app.pagescms.org/

## First-time setup (owner only)

1. Open **https://app.pagescms.org/**.
2. **Sign in with your GitHub account, \`moreshwarp\`**.
3. GitHub will ask you to approve/install the Pages CMS GitHub App. Grant access only to the \`Moreshwar\` repository.
4. Select \`moreshwarp/Moreshwar\`, branch \`main\`. Pages CMS discovers the repository's \`.pages.yml\` configuration automatically.
5. You will see **Research essays & blog posts**, **Site appearance — OWNER CONTROLLED**, and **Theme-based recommendations**.

The public GitHub Pages website has **no editor login, publishing controls, theme selector, or editable password**. Only authenticated GitHub users with repository write permission can publish. Don't share your GitHub account or authentication codes. A visitor can read your public GitHub source, but cannot change it without write permission.

## Writing and publishing an article

1. Open **Research essays & blog posts** in Pages CMS.
2. Select **New**, enter a title, summary, date and category.
3. Write the full body in its **rich-text editor**. Headings, lists, images, links, code blocks, bold and italics are supported.
4. Leave **Publish publicly?** unchecked while editing.
5. When you've reviewed your work and references, change **Publish publicly?** to **on** and save.
6. GitHub commits the change; **Deploy Moreshwar / Lab** automatically rebuilds the public website.
7. Your article appears in the **New from the Editorial Notebook** section with a dedicated article URL.
8. A GitHub Issue discussion is created automatically for its comments and reactions.

**IMPORTANT:** The GitHub repository is public. A draft marked \`published: false\` is **excluded from GitHub Pages**, but its Markdown file **can be read in the public GitHub repository**. Do not store confidential drafts, passwords, personal notes, or unpublished sensitive research in this public repository. For confidential drafts, use a separate private repository or an offline editor until you're ready to publish.

The example article in \`content/posts/example-draft.md\` starts with \`published: false\` and will not appear on the website.

### An alternative without Pages CMS

An authenticated repository owner can also open \`content/posts\` directly in GitHub, select **Add file → Create new file**, write Markdown with YAML front matter, set \`published: true\`, and commit to \`main\`. The same secure GitHub permissions and deployment workflow apply.

## Changing the global website theme

Go to **Site appearance — OWNER CONTROLLED**:

- **theme:** choose one of \`science\`, \`hero\`, \`noir\`, \`quantum\`, \`shinobi\`, \`bureau\`, \`nature\`, \`terminal\`, \`circuit\`, or \`arcade\`.
- **brightness:** choose \`dark\` or \`light\`.
- Save. GitHub Pages rebuilds one consistent theme across the homepage and all reading pages.

**Only the site publisher can edit this configuration.** Visitors have no theme button and browser-local choices cannot override the owner-published appearance. The three Systems / AI-ML / Frontend buttons on the graphic remain interactive demonstrations; they do not alter the website theme.

The theme selections are original, genre-inspired colors and graphics. They do not imply affiliation with entertainment franchises.

## Updating movie, book, article and YouTube recommendations

Open **Theme-based recommendations**. This collection contains four candidate items for each of the ten themes.

- Choose a \`universe\` to determine which published theme displays the item.
- Select media type, title, creator, annotation, and URL.
- Set \`approved: true\` **only if you've personally reviewed and endorsed it**. Otherwise the website labels it \`CURATED LEAD\`, not a personal recommendation.
- Save, wait for GitHub Pages deployment, and refresh the site.

Only the four items aligned with the current published theme appear by default.

## Reader comments, likes, and moderation

Each of the existing 25 reading pages has its own GitHub Issue, and new editor-published essays receive their own thread automatically. The website shows a recent public comment preview and reaction/comment counts when GitHub's public API is available.

Readers click **Like on GitHub** or **Write a comment** to open the correct issue. They must sign in to GitHub to react or comment. The public website cannot securely accept unrestricted authenticated reactions by itself; GitHub provides the identity, moderation and storage. There is no fake local-only like counter.

To moderate:

1. Open your repository's **Issues** tab on GitHub.
2. Find the issue headed \`Reader discussion · [article title]\`.
3. Reply to readers, hide abusive comments where supported, or lock/close the conversation as needed.

Avoid publishing private contact information in comments; GitHub discussions are public.

## Testing and troubleshooting

- **Automated unit checks:** \`node --test tests/*.test.cjs\`
- **Hosted site:** https://moreshwarp.github.io/Moreshwar/
- **Deploy workflow:** https://github.com/moreshwarp/Moreshwar/actions/workflows/pages.yml
- **Quality checks:** https://github.com/moreshwarp/Moreshwar/actions/workflows/quality.yml
- **Browser QA:** https://github.com/moreshwarp/Moreshwar/actions/workflows/browser-qa.yml

See \`TEST_PLAN.md\` for a complete acceptance matrix.

### External services still requiring verification

- Pages CMS requires **your explicit GitHub authorization and app installation** before the visual editor can be used.
- The contact form still uses FormSubmit; your Gmail inbox must verify/activate that service before real delivery can be confirmed.
- GitHub issues and their reactions require visitors to sign in to GitHub to interact.

Do not call these independent external services verified until their real first-use tests succeed.
