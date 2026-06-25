const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

// comic.pixiv.net's app API returns 403 to non-browser requests; a browser-like
// User-Agent plus a same-origin referer/origin and the XHR marker are required.
export const pixivComic = {
  base: 'https://comic.pixiv.net',
  api: 'https://comic.pixiv.net/api/app',
  headers: {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'ja,en-US;q=0.9,en;q=0.8',
    'user-agent': BROWSER_UA,
    referer: 'https://comic.pixiv.net/',
    origin: 'https://comic.pixiv.net',
    'x-requested-with': 'XMLHttpRequest',
  },
}
