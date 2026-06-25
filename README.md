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
  providers/         registry + shared contract/helpers, and one
    <name>/          self-contained folder per provider:
                       config.ts, taxonomy.ts, queries.ts, index.ts
  services/          mangadex, matcher (MangaDex lookup side)
  lib/               http, title normalization/matching, concurrency
public/              vanilla HTML/CSS/JS client
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
