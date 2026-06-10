# humerez.dev

Bilingual (EN/ES) portfolio landing page for Diego Humerez — Gundam/mecha-themed,
static, dependency-free, optimized for classic SEO **and** AI search (GEO).

Live: https://humerez.dev · Spanish: https://humerez.dev/es/

## Structure

```
site/                  ← everything that gets deployed (document root)
  index.html           English page (canonical, x-default)
  es/index.html        Spanish page
  assets/site.css      shared styles (animations, HUD theme, reduced-motion aware)
  assets/site.js       shared behavior (reveals, typewriter, counters, tilt, language)
  assets/og-image.png  social card (1200×630)
  assets/favicon.svg / apple-touch-icon.png · favicon.ico (root)
  robots.txt           allows all crawlers + explicit AI crawler allowances
  sitemap.xml          both language URLs with hreflang alternates
  llms.txt             AI-crawler summary of who/what/projects/contact
  404.html             themed error page
tools/                 build-time helpers (og-image + favicon render templates)
deploy.sh              server-side deploy (runs via the host webhook listener)
.github/workflows/     CI deploy on push to master
```

## Language handling

- Separate crawlable URLs per language (`/` EN, `/es/` ES) with reciprocal
  `hreflang` + `x-default` — per Google's i18n guidelines (no server-side forced
  redirects, so both versions stay indexable).
- On a visitor's **first** visit to `/`, if the browser reports Spanish
  (`navigator.languages`), JS switches to `/es/`. A manual toggle choice is
  stored in `localStorage` and always wins. Bots don't trigger this.

## AI search (GEO) checklist baked in

- First ~200 words of each page literally answer "who is Diego Humerez / what
  does he do / is he available".
- JSON-LD `@graph`: `Person` + `WebSite` + `ProfilePage` + `ItemList` of projects.
- `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot,
  Google-Extended, etc. `llms.txt` provides an LLM-friendly summary.
- Semantic headings, real text content (no text-in-images), fast static pages.

## Deploys

Push to `master` deploys twice over (idempotent, same content):

1. **GitHub Action**: rsyncs `site/` → `/opt/traefik/landing/site/` (secret `SSH_PRIVATE_KEY`).
2. **Host webhook** (`/opt/webhook`, shared pattern with the other apps): runs
   `deploy.sh` in `/opt/apps/humerez-landing` (git pull + rsync to the same target).

Serving: `nginx` container (`landing` service in `/opt/traefik/docker-compose.yml`)
mounts `/opt/traefik/landing/site` as its docroot behind Traefik
(LE cert, www→apex and http→https redirects).

## Regenerating assets

`tools/og-template.html` (1200×630) and `tools/favicon-render.html` (512×512)
are rendered with a headless browser screenshot, then `favicon.ico` /
`apple-touch-icon.png` are derived with Pillow. See git history for the exact
commands.
