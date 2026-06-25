const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

// ニコニコ漫画. The manga service moved off `seiga.nicovideo.jp` (now legacy and
// region-locked outside Japan) to `manga.nicovideo.jp`, which answers globally
// without login. The public content-search and `ajax/manga/list` APIs are gone
// or login-walled, so this provider scrapes the server-rendered catalog
// (`/manga/list`), which paginates the full library and exposes a total count.
export const nico = {
  base: 'https://manga.nicovideo.jp',
  site: 'https://manga.nicovideo.jp',
  headers: {
    accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
    'accept-language': 'ja,en;q=0.9',
    'user-agent': BROWSER_UA,
  },
}
