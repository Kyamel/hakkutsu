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
ComicWalker. For `/api/works` and `/api/new`, test on the edge with the staging
Worker:

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

1. Browse comic-walker works by tag (paginated, sortable by recency/popularity).
2. Click a work to look it up on MangaDex by its Japanese title.
3. See the matched title, link, and chapter count + last-chapter date per
   translated language (English highlighted).

The API is the source of truth; the page in `public/` is a thin client.

## HTTP API

Interactive API docs are available at:

- `GET /api/docs` — Swagger UI.
- `GET /api/openapi.json` — generated OpenAPI document.

The OpenAPI document is generated from the route definitions and Zod schemas in
`src/api/routes.ts` and `src/api/schemas.ts`.

- `GET /api/tags` — curated comic-walker genres/tags, each with a `slug`.
- `GET /api/works?genre=&tag=&genreId=&tagId=&limit=&offset=&sortBy=` —
  paginated works for a genre, a tag, or one of each together. Prefer
  `genre=<slug>&tag=<slug>` using the lower-case slugs from `/api/tags`.
  `sortBy` is `new` (recently updated) or `popularity`.
- `GET /api/new?limit=&offset=` — the recently updated series feed, independent
  of any tag. Same `WorksPage` shape as `/api/works`.
- `GET /api/works?free=1&tag=&limit=&offset=` — the free-campaign feed. `tag` is
  a free category (see `/api/free/categories`); omit it for all free titles.
  Results carry `freeEpisodeCount`.
- `GET /api/free/categories` — the 12 free-campaign categories (own set, keyed
  by string `type`, distinct from the genre/tag taxonomy).
- `GET /api/match?title=` — best MangaDex match for a title, with per-language
  availability. Returns `{ matched: false }` when nothing matches confidently.

## Layout

```
src/
  config.ts          endpoints, headers, curated tags, match threshold
  types.ts           shared domain types
  api/routes.ts      HTTP layer (Hono)
  services/          comicwalker, mangadex, matcher
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
- Refresh the tag list from comic-walker instead of shipping a static set.
- React SPA against the same API; deploy the API publicly.
