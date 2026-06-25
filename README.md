# 発掘 hakkutsu

Discover manga on [comic-walker](https://comic-walker.com) and check whether
[MangaDex](https://mangadex.org) already has it translated — and how stale each
language is.

## Live app

https://hakkutsu.lucascamelo03.workers.dev

## Run

```
npm install
npm run dev
```

```
open http://localhost:8787
```

`npm run dev` runs the Cloudflare Workers runtime locally with Wrangler and
serves `public/` as static assets.

### Local Worker TLS limitation

The ComicWalker endpoints work after deploy, but may fail in local Wrangler dev
with a `workerd` TLS error like:

```
TLS peer's certificate is not trusted; reason = unable to get local issuer certificate
```

This is a local `workerd` certificate validation issue. The same request worked
in the old Node dev server because Node uses a different local trust store, and
it also works in the deployed Cloudflare Worker.

Use `npm run dev` for static assets and API routes that do not call
ComicWalker. For `/api/works`, test on the edge with the staging Worker:

```
npm run deploy:staging
```

## Deploy

The app deploys as one Cloudflare Worker:

- API routes run in `src/worker.ts` under `/api`.
- Static frontend files are uploaded from `public/` and served directly by
  Cloudflare Workers assets.
- Production runs at <https://hakkutsu.lucascamelo03.workers.dev>.

Deploy manually with:

```
npm run deploy
```

For edge testing without touching production, deploy the staging Worker:

```
npm run deploy:staging
```

Then test the staging URL printed by Wrangler, for example
`https://hakkutsu-staging.<your-subdomain>.workers.dev/api/works?tag=fantasy&limit=1`.

Automatic deploys run from `.github/workflows/deploy-worker.yml` on pushes to
`main`. The workflow runs `npm ci`, `npm run build`, then
`npm run deploy` to target the top-level production Worker explicitly.
Add these GitHub repository secrets before enabling the workflow:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

## Android app

The Android app is a Capacitor build of the same frontend and Hono API core.
It does not call the deployed Cloudflare Worker for API routes:

- The UI is built from `mobile/index.html` and reuses `public/app.js` and
  `public/styles.css`.
- `src/mobile/entry.ts` intercepts local `/api/*` requests and serves them with
  the in-process Hono app from `src/app.ts`.
- External provider requests still go directly to ComicWalker, Pixiv Comic,
  Nico Nico Manga, and MangaDex from the device. `CapacitorHttp` is enabled so
  Android uses native HTTP for those upstream calls.
- Worker-only features are not part of the Android runtime: no Workers cache,
  no `/api/docs`, and no `/api/openapi.json`.
- The native provider registry can include providers that do not work from
  Cloudflare egress. Pixiv Comic is native-only right now because its API returns
  403 from the deployed Worker but works from normal client networks.

Build and sync the Android project:

```
npm run build:mobile
```

Build a local debug APK:

```
cd android
./gradlew assembleDebug
```

The debug APK is written to:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

You need a local JDK and Android SDK for Gradle builds. The GitHub workflow uses
JDK 21 automatically.

### Android release workflow

`.github/workflows/android-release.yml` publishes APKs to a GitHub Release.
Trigger it by pushing an Android tag:

```
git tag android-v0.1.0
git push origin android-v0.1.0
```

Or run **Android APK Release** manually from GitHub Actions.

The workflow always builds and uploads a debug APK. To also publish a signed
release APK, add these repository secrets:

- `ANDROID_KEYSTORE_BASE64` — base64-encoded `.jks` keystore.
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

## How it works

1. Browse provider works by genre/tag (paginated, sortable by provider options).
2. Click a work to look it up on MangaDex by its Japanese title.
3. See the matched title, link, and chapter count + last-chapter date per
   translated language (English highlighted).

The API is the source of truth; the page in `public/` is a thin client.

## HTTP API

Interactive API docs are available at:

- `GET /api/docs` — Swagger UI.
- `GET /api/openapi.json` — generated OpenAPI document.
- `GET /api/providers` — available source providers, capabilities, and cache TTLs.

The OpenAPI document is generated from the route definitions and Zod schemas in
`src/api/routes.ts` and `src/api/schemas.ts`.

- `GET /api/taxonomy?provider=` — provider genres, tags, and sort options. Tags
  may be an empty list when the provider does not support them.
- `GET /api/works?provider=&genre=&tag=&genreId=&tagId=&feed=&limit=&offset=&sortBy=` —
  the canonical search endpoint. `provider` defaults to `comicwalker`; use
  `provider=comicwalker-free` for the free-campaign feed. `feed=new` lists
  recent ComicWalker updates. Prefer `genre=<slug>&tag=<slug>` using the
  lower-case slugs from `/api/taxonomy`.
- `GET /api/works?provider=comicwalker-free&tag=&limit=&offset=` — the
  free-campaign provider. `tag` is one of its provider-owned taxonomy tags from
  `/api/taxonomy?provider=comicwalker-free`; omit it for all free titles.
  Results carry `freeEpisodeCount`.
- `GET /api/match?title=` — best MangaDex match for a title, with per-language
  availability. Returns `{ matched: false }` when nothing matches confidently.

## Layout

```
src/
  config.ts          MangaDex config + match threshold
  types.ts           shared domain types
  api/routes.ts      HTTP layer (Hono)
  app.ts             shared Hono app factory for Worker, Node dev, and Android
  worker-app.ts      Worker/Node app with OpenAPI + Swagger docs enabled
  mobile/            Capacitor entrypoint that runs the API locally on Android
  providers/         registry + shared contract/helpers, and one
    <name>/          self-contained folder per provider:
                       config.ts, taxonomy.ts, queries.ts, index.ts
  services/          mangadex, matcher (MangaDex lookup side)
  lib/               http, title normalization/matching, concurrency
public/              vanilla HTML/CSS/JS client
mobile/              Capacitor HTML shell
android/             generated Capacitor Android project
```

## Matching notes

Japanese titles are a short main title plus a long subtitle that often differs
between the comic-walker and MangaDex editions. We search MangaDex with the main
title (the head before the first separator) and score candidates on both the
full title and the head, so edition-specific subtitles don't break the match.

## Possible next steps

- Local cache (SQLite) so repeated MangaDex lookups are cheap.
- Refresh provider taxonomies from upstream sources instead of shipping static sets.
- React SPA against the same API; deploy the API publicly.
