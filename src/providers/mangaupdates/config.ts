const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

// MangaUpdates is a global manga metadata database (not a vendor) with a public,
// documented REST API that answers without auth or geo-restriction. We use the
// series search endpoint as a filterable browse backend.
export const mangaUpdates = {
  base: 'https://api.mangaupdates.com/v1',
  site: 'https://www.mangaupdates.com',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'user-agent': BROWSER_UA,
  },
}
