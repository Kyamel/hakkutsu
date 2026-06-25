# Provider roadmap

Hakkutsu should grow as a provider-based discovery API. The first two providers
are ComicWalker and ComicWalker Free; planned next providers, in priority order:

1. ComicWalker
2. Nico Nico Manga
3. Pixiv Comic
4. Manga UP!
5. LINE Manga
6. Piccoma

With these six sources, Hakkutsu can monitor thousands of Japanese series while
keeping the API surface stable.

## Provider contract

Each provider should expose a small normalized shape:

- Provider identity: `id`, `name`, `site`.
- Capabilities: genres, tags, free feed, new feed, popularity sort.
- Taxonomy: provider-owned `genres`, optional `tags`, and available `sorts`.
- Search filters: at minimum one provider-specific tag or genre, when available.
- Normalized works: provider id/name, provider work id/code, title, URL,
  thumbnail, language, serialization status, optional publisher, optional
  popularity score.

Provider-specific details should stay behind the provider module. The API should
prefer stable query params like `provider`, `genre`, `tag`, `genreId`, and
`tagId`.

## Adding a provider

Provider modules own their behavior. Adding a provider should not require edits
to API route handlers or Worker cache logic.

Steps:

1. Create a provider module in `src/providers/`.
2. Export an object that satisfies `MangaProvider`.
3. Register that object in `src/providers/index.ts`.

After registration:

- `GET /api/providers` lists it automatically.
- `GET /api/taxonomy?provider=<id>` returns its genres, tags, and sort options.
- `GET /api/works?provider=<id>` uses its `search()` implementation.
- Worker cache TTL comes from `provider.summary.ttl.search` and
  `provider.summary.ttl.metadata`.

ComicWalker is intentionally split into two providers now:

- `comicwalker`: regular genre/tag/new-release search.
- `comicwalker-free`: free-campaign search.

That split is a practical test of the provider contract. The API route handlers
do not need separate ComicWalker-free branching for search.

## Runtime limitations

Pixiv Comic is implemented in `src/providers/pixiv-comic/`, but is not
registered in production right now. Its API responds locally from a normal Node
request with browser-like headers, but returns `403` from Cloudflare Workers
egress for both category and recent-update endpoints. Headers are not enough to
fix that; it appears to be upstream bot/datacenter filtering.

To enable Pixiv Comic safely, we need one of these:

- A documented upstream API/auth path that allows server-side requests.
- A non-Workers proxy/origin that Pixiv accepts, with caching and rate limits.
- A different public source for Pixiv Comic metadata.

## Popularity signal idea

The useful discovery view is not just "what exists in Japan"; it is "what is
popular in Japan and under-covered on MangaDex".

Candidate display fields:

```text
Popularity JP: 8.7/10
MangaDex: Not Found
English chapters: 0
Last update: 3 days ago
Publisher: Kadokawa
```

Suggested sort:

1. High Japanese popularity.
2. Low MangaDex presence.
3. Low or zero English chapter count.
4. Recent provider update.

That ranking should surface the sweet spot: manga that are gaining traction in
Japan but have not yet received attention from scanlators.

## Normalized popularity

Providers expose different signals: ranking position, view counts, likes,
comments, bookmarks, free-campaign prominence, or provider-native popularity
sorts. Hakkutsu should normalize those to a `popularityJp` value from `0` to
`10`.

Initial approach:

- Prefer provider-native ranking/popularity order when no raw counts are exposed.
- Convert rank position within a fetched page/feed to an approximate score.
- Store the raw provider signal separately later if we add KV/D1.
- Keep `popularityJp` optional until a provider has a credible signal.

Avoid pretending precision we do not have. A rough but honest score is better
than a made-up decimal.
