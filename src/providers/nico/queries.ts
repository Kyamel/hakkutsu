import { fetchText } from '../../lib/http.js'
import type { Work, WorksPage } from '../../types.js'
import { toPage } from '../pagination.js'
import type { Pagination } from '../types.js'
import { nico } from './config.js'

export interface CatalogParams extends Pagination {
  category: string // catalog category slug, e.g. 'shonen'; 'all' = whole library
  sort: string // manga_updated | manga_favorite | manga_created | comment_created | view
}

// The catalog lists 20 works per page.
const PAGE_SIZE = 20

// Each work is one <li class="mg_item item"> … </li>. Within it:
//   - the title is the sole text-only anchor to /comic/{id}?track=list (the other
//     anchors to the same id wrap an <img>/<div>, so [^<]+ excludes them);
//   - the work cover is the <img> inside the `center_img_inner` anchor (the
//     `mg_icon` art). The other thumb on the card (`thumb_image`/`mg_thumb`) is
//     the latest episode's image, not the work cover.
// The page also prints the catalog size as <span class="number">{n}件</span>.
const ITEM_SPLIT = /<li class="mg_item item"/
const TITLE_RE = /<a [^>]*?href="\/comic\/(\d+)\?track=list"[^>]*>([^<]+)<\/a>/
const COVER_RE = /<a class="center_img_inner[^>]*>\s*<img src="([^"]+)"/
const TOTAL_RE = /<span class="number">(\d+)件/

// Browse the full catalog (category + sort), bridged to the limit/offset
// contract. The page is fixed at 20 items, so we pull the pages spanning the
// requested window, slice it out, and report the real total the page exposes.
export async function listCatalog(params: CatalogParams): Promise<WorksPage> {
  const { limit, offset, category, sort } = params
  const startPage = Math.floor(offset / PAGE_SIZE) + 1
  const endPage = Math.floor((offset + Math.max(limit, 1) - 1) / PAGE_SIZE) + 1
  const localStart = offset % PAGE_SIZE

  const collected: Work[] = []
  let total = 0
  for (let page = startPage; page <= endPage; page += 1) {
    const { works, totalCount } = await fetchCatalogPage(category, sort, page)
    total = totalCount
    collected.push(...works)
    if (works.length < PAGE_SIZE) break // reached the last page
  }

  const results = collected.slice(localStart, localStart + limit)
  return toPage(total, results, { limit, offset })
}

async function fetchCatalogPage(category: string, sort: string, page: number) {
  const query = new URLSearchParams({ sort, page: String(page) })
  if (category !== 'all') query.set('category', category)
  const html = await fetchText(`${nico.base}/manga/list?${query}`, { headers: nico.headers })

  const totalCount = Number(html.match(TOTAL_RE)?.[1] ?? 0)
  const works: Work[] = []
  for (const chunk of html.split(ITEM_SPLIT).slice(1)) {
    const title = chunk.match(TITLE_RE)
    if (!title) continue
    const cover = chunk.match(COVER_RE)?.[1] ?? ''
    works.push(toWork(title[1], cover, title[2]))
  }
  return { works, totalCount }
}

function toWork(id: string, thumbnail: string, rawTitle: string): Work {
  return {
    provider: 'nico',
    providerName: 'ニコニコ漫画',
    id,
    code: id,
    title: decodeEntities(rawTitle),
    url: `${nico.base}/comic/${id}`,
    thumbnail,
    thumbnailAspectRatio: 1, // mg_icon covers are 160x160 square
    language: 'ja',
    serializationStatus: 'unknown',
  }
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
}

function decodeEntities(text: string): string {
  return text.replace(/&(#?\w+);/g, (whole, name: string) => ENTITIES[name] ?? whole)
}
