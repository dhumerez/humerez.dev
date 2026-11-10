# humerez.dev

Bilingual (EN/ES) portfolio landing page for Diego Humerez — Gundam/mecha-themed,
static, dependency-free, optimized for classic SEO **and** AI search (GEO).

Live: https://humerez.dev · Spanish: https://humerez.dev/es/

## Structure

```
site/                  ← everything that gets deployed (document root)
  index.html           English page (canonical, x-default)
  es/index.html        Spanish page
  assets/site.css      shared styles (3D hero rig, starfield, HUD theme, reduced-motion aware)
  assets/site.js       shared behavior (reveals, typewriter, counters, tilt, language)
  assets/og-image.png  social card (1200×630)
  assets/favicon.svg / apple-touch-icon.png · favicon.ico (root)
  robots.txt           allows all crawlers + explicit AI crawler allowances; blocks QA paths
  robots/<host>.txt    robots.txt for the app subdomains (see "robots.txt for the other apps")
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

## robots.txt for the other apps

The app subdomains on the same server (restaurant, pagos, seguros, sunimex) do not
ship a robots.txt of their own. Instead of rebuilding each app for a text file, one
Traefik router (`server/traefik-robots.yml`, merged into `/opt/traefik/dynamic.yml`)
sends `Host(<app>) && Path(/robots.txt)` to this landing's nginx, which answers with
`site/robots/<host>.txt` (`try_files /robots/$host.txt /robots.txt`). To cover a new
app: add `site/robots/<host>.txt`, push, and add its `Host()` to the router rule.
`legal.humerez.dev` serves its own robots.txt and is not routed here. QA copies live
under `humerez.dev/<path>` and are disallowed in `site/robots.txt`.

## Deploys

Push to `master` → the host webhook listener (`/opt/webhook`, same pattern as
the other apps on the box) runs `deploy.sh` in `/opt/apps/humerez-landing`:
`git fetch` + `reset --hard origin/master`, then rsync `site/` →
`/opt/traefik/landing/site/`. Verified end-to-end.

(A GitHub Actions workflow used to exist but the account has Actions locked by
a billing issue, so every run failed; it was removed in favor of the webhook.
Manual fallback: run `bash deploy.sh` on the server, or rsync/scp `site/` to
`/opt/traefik/landing/site/` yourself.)

Serving: `nginx` container (`landing` service in `/opt/traefik/docker-compose.yml`)
mounts `/opt/traefik/landing/site` as its docroot behind Traefik
(LE cert, www→apex and http→https redirects).

## Regenerating assets

`tools/og-template.html` (1200×630) and `tools/favicon-render.html` (512×512)
are rendered with a headless browser screenshot, then `favicon.ico` /
`apple-touch-icon.png` are derived with Pillow. See git history for the exact
commands.
