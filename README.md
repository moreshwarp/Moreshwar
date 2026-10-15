# Moreshwar / Lab — research portfolio

A mobile-first, interactive personal engineering and research portfolio. It is a **dynamic website architecture**: GitHub Pages serves the browser experience, while optional Supabase provides live content, authenticated publishing and a secure contact API. Without configured Supabase, the website operates as a demonstrable front-end with browser-local drafts; it is **not** a working public CMS or email service until setup is completed.

## Architecture

- **Front end:** semantic HTML, CSS, modern JavaScript (no build step), accessible dialogs, responsive layouts, text-only fallbacks.
- **Interactive art:** Three.js WebGL point-cloud, loaded progressively from a pinned CDN version, paused while offscreen and excluded on small/reduced-motion devices.
- **Content:** Supabase Postgres + Row Level Security; post and reference CRUD for a specifically authorized admin, public read of published entries.
- **Auth:** Supabase Auth email magic link for admin, no passwords in front-end source.
- **Email:** Supabase Edge Function uses the Resend API with server-side secrets and IP-hash hourly rate limiting. Visitors do not need accounts to contact you.
- **Hosting:** GitHub Actions → GitHub Pages (once you enable GitHub Pages for the repository).

## Try it locally

From this directory:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. The default site renders sample essays and suggested books. The editorial desk (bottom of Writing) supports local drafts and JSON backup even without Supabase.

## Publish the site through GitHub

1. Push these files to the **main** branch of a repository you own. Avoid publishing unverified academic credentials or private information.
2. Under GitHub repository **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. If your GitHub plan does not support Pages on a private repository, change its visibility to **public** using GitHub settings, only after reviewing the repository. GitHub Pages is public-facing even when the source repo is private (on supported plans).
4. The included workflow deploys on each push to `main`. A project repository called `Moreshwar` will normally use `https://moreshwarp.github.io/Moreshwar/`, but treat this as an expected URL, **not proof of a live deployment**.

## Enable real-time content + publishing (required for a truly dynamic site)

1. Create a Supabase project at https://supabase.com/.
2. In **SQL Editor**, run `supabase/schema.sql`.
3. In **Authentication → Users**, sign in with your intended admin email once, get your authenticated user's UUID, then execute the example `insert into public.admins ...` statement from the bottom of `schema.sql`.
4. Edit `config.js` and set only `supabaseUrl` and `supabasePublishableKey`. These are intentionally public values; **never** put service keys in `config.js` or GitHub.
5. In **Authentication → URL Configuration**, add your deployed GitHub Pages URL to allowed redirect URLs (including trailing slash path).
6. Use the **Editorial desk**: log in with a magic link, create an article or reference and mark it published. The published content will be visible to every visitor, from your hosted database.
7. Seed the database with your own verified essays and books; the initial local sample content is not automatically copied to Supabase. Browser-local backups can be used as a drafting aid.

## Enable real emails to your Gmail inbox

1. Create a Resend account at https://resend.com and verify a sender domain you control.
2. Install the Supabase CLI, link your Supabase project, then set function secrets:

```bash
supabase secrets set \
  RESEND_API_KEY='YOUR_API_KEY' \
  CONTACT_TO_EMAIL='YOUR_GMAIL_ADDRESS' \
  CONTACT_FROM_EMAIL='Website <contact@YOUR_VERIFIED_DOMAIN>' \
  CONTACT_RATE_SALT='LONG_RANDOM_STRING' \
  SITE_ORIGIN='https://moreshwarp.github.io'
supabase functions deploy contact --no-verify-jwt
```

The `SITE_ORIGIN` is the **origin only**, with no `/Moreshwar` path. Use the exact origin at which the site is hosted. Set your Gmail address as a **server secret** so it is not published in client-side source.

3. Test from the hosted website. The UI reports success **only when the email API confirms a successful send**. A delivery confirmation from Resend does not guarantee the message reaches Gmail's inbox rather than Spam; check your email and verify SPF/DKIM.

### Security notes

- Supabase **publishable** key may appear in a browser, but Row Level Security must remain enabled.
- Only admin UUIDs in `admins` can create/modify/delete posts and references.
- Contact submissions pass through a server function; user data is not directly insertable by anonymous visitors.
- Public email endpoints can still attract spam; rate limits and a honeypot help, but consider a managed CAPTCHA/Turnstile if abused.
- GitHub Pages hosts frontend only. A dynamic backend must run elsewhere (Supabase in this implementation).
- URLs in Markdown are restricted to HTTP(S); HTML is escaped before rendering.
- Before publishing, confirm institutional and employment details, obtain permission for client case studies and replace the portrait placeholder with a photo you own.

## Key files

- `index.html` — responsive site, dialogs and accessible forms
- `styles.css` — design system, animation, responsive breakpoints and reduced-motion behavior
- `app.js` — content rendering, editor, research diagram, search and Three.js integration
- `config.js` — safe public site configuration
- `supabase/schema.sql` — database and row-level permissions
- `supabase/functions/contact/index.ts` — email submission endpoint (server-side)
- `.github/workflows/pages.yml` — site deployment workflow

## Project scope

The three essays in demo mode were generated as site editorial examples and are **not attributed as previously published original works**. Technical cases reflect general topics from earlier engineering discussion without inventing outcomes.

## Author's Substack + Instagram

Public profile links are wired into the homepage, About, Writing, Contact and footer:
- Substack: https://moreshwarpidadi.substack.com/
- Instagram: https://www.instagram.com/moreshwar_pidadi/

The Writing section loads \`substack-posts.json\` and adds imported article titles,
dates, excerpts and outbound links to the existing searchable notebook. Substack
posts are read on Substack; the site does not claim to mirror their full text.

The importer is \`scripts/sync_substack.py\`, run by \`.github/workflows/sync-substack.yml\`
daily and when dispatched manually. The website is still available if Substack
blocks RSS access; the archive file is never overwritten with fabricated posts.

**Current limitation (Oct 2026):** Automated access to
\`https://moreshwarpidadi.substack.com/feed\` returned HTTP 403 in GitHub Actions,
so the published-article JSON currently contains no imported posts. The
sample notebook entries are visibly marked "SAMPLE NOTE". To perform a full
migration, export your *published* posts from Substack's author dashboard and
provide the export file (CSV/ZIP). Import only the posts you authorize for
public display; exclude drafts and subscriber-only content unless intended.


## Imported original published Substack articles

The Writing section now contains **22 real, published articles** from the author's Substack export. Each one has its own self-contained, responsive reading page under `articles/`, with original text, permitted formatting, publication date and source attribution. The website searches these entries directly and links to the article pages.

The import deliberately excluded **two unpublished drafts**, the exported subscriber email list, and all delivery/open analytics. It also removed the three machine-written sample articles from the public Writing collection.

`substack-posts.json` is the index. It is marked `origin: manual-export`, which prevents the optional RSS job from overwriting verified author content. To update the archive, import a fresh published-only Substack export; don't upload the raw export ZIP into a public repository.


## Interactive systems lab (October 2026)

This website contains three **working, in-browser educational models**, rather
than promotional project mockups:
- **Tail exposure:** the idealized independent fan-out model `1-(1-p)^n`.
- **Queueing:** the M/M/1 stationary mean response-time formula with overload handling.
- **Two-replica state:** a manual delivery model illustrating stale reads.

The models are didactic abstractions, **not recorded engineering benchmarks**,
production traces, or completed scientific experiments. The source is in
`lab.js`, visuals in `lab.css`, and controls are semantic HTML in `index.html`.

### New systems writing

Three long-form educational articles are included in `articles/fieldnote-*.html`.
They are attributed to **Moreshwar Pidadi with an explicit AI-assisted editorial
draft disclosure**. They are not peer-reviewed, do not claim novel results, and
should be personally reviewed and revised by the named author before treating
them as independently authored scholarship:

1. Why the Slowest Request Can Dominate a Fast System.
2. What a Stale Read Teaches Us About Distributed Systems.
3. Why Queues Make Fast Systems Feel Slow.

Their references include Lamport's 1978 logical-clock paper, Dean and Barroso's
2013 tail-latency analysis, OSTEP, Google SRE, and Kleppmann's distributed-systems
text. The 22 Substack originals remain separate and preserved.
