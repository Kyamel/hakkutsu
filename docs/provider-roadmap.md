# Provider roadmap

Hakkutsu should grow as a provider-based discovery API. The current provider is
ComicWalker; planned providers, in priority order:

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
- Search filters: at minimum one provider-specific tag or genre, when available.
- Normalized works: provider id/name, provider work id/code, title, URL,
  thumbnail, language, serialization status, optional publisher, optional
  popularity score.

Provider-specific details should stay behind the provider module. The API should
prefer stable query params like `provider`, `genre`, `tag`, `genreId`, and
`tagId`.

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
