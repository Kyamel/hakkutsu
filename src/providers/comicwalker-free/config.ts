const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

// ComicWalker rejects non-browser requests, so a browser-like User-Agent and
// referer are required.
export const comicWalkerFree = {
  base: 'https://comic-walker.com',
  site: 'https://comic-walker.com/free',
  headers: {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': BROWSER_UA,
    referer: 'https://comic-walker.com/free',
  },
}
