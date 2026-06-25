import { fetchJson } from '../../lib/http.js'
import type { Work, WorksPage } from '../../types.js'
import type { Pagination } from '../types.js'
import { pixivComic } from './config.js'
import { pixivCategoryNameById } from './taxonomy.js'

// pixiv コミック returns fixed-size, page-numbered lists with no total count, so
// this provider adapts that model to the limit/offset contract (see `paginate`).
interface OfficialWork {
  id: number
  name: string
  author: string
  image: { main: string; main_big: string; thumbnail: string }
}

interface RecentUpdatesResponse {
  data: {
    next_page_number: number | null
    official_works: OfficialWork[]
  }
}

interface CategoryWorksResponse {
  data: {
    next_page_number: number | null
    official_works: OfficialWork[]
  }
}

// Category works are paged 20 at a time; the recent-updates feed 30 at a time.
const CATEGORY_PAGE_SIZE = 20
const RECENT_PAGE_SIZE = 30

// Browse every work in a category (by numeric category id), ordered as pixiv
// presents the category page.
export function listByCategory(categoryId: string, page: Pagination): Promise<WorksPage> {
  const name = pixivCategoryNameById.get(categoryId) ?? categoryId
  const path = `${pixivComic.api}/categories/${encodeURIComponent(name)}/works`
  return paginate(CATEGORY_PAGE_SIZE, page, async (pageNumber) => {
    const url = `${path}?page=${pageNumber}`
    const { data } = await fetchJson<CategoryWorksResponse>(url, { headers: pixivComic.headers })
    return { works: data.official_works.map(toWork), hasNext: data.next_page_number != null }
  })
}

// Recently updated series for the current JST day, optionally narrowed to one
// category (numeric id) via `category_ids`.
export function listRecent(page: Pagination, categoryId?: string): Promise<WorksPage> {
  const targetDate = todayInTokyo()
  const path = `${pixivComic.api}/works/recent_updates/v2`
  const filter = categoryId ? `&category_ids=${encodeURIComponent(categoryId)}` : ''
  return paginate(RECENT_PAGE_SIZE, page, async (pageNumber) => {
    const url = `${path}?target_date=${targetDate}&page=${pageNumber}${filter}`
    const { data } = await fetchJson<RecentUpdatesResponse>(url, { headers: pixivComic.headers })
    return { works: data.official_works.map(toWork), hasNext: data.next_page_number != null }
  })
}

interface UpstreamPage {
  works: Work[]
  hasNext: boolean
}

// Bridge pixiv's page-numbered feeds to limit/offset. We start from the upstream
// page that contains `offset`, pull forward until the requested window is filled,
// then slice it out. pixiv exposes no total count (only "is there a next page"),
// so `total` is null and the client paginates by hasPrevious/hasNext.
async function paginate(
  pageSize: number,
  { limit, offset }: Pagination,
  fetchPage: (pageNumber: number) => Promise<UpstreamPage>,
): Promise<WorksPage> {
  const startPage = Math.floor(offset / pageSize) + 1
  const localStart = offset % pageSize
  const need = localStart + limit

  const collected: Work[] = []
  let pageNumber = startPage
  let upstreamHasNext = false
  while (collected.length < need) {
    const { works, hasNext } = await fetchPage(pageNumber)
    collected.push(...works)
    upstreamHasNext = hasNext
    if (!hasNext || works.length === 0) break
    pageNumber += 1
  }

  const results = collected.slice(localStart, localStart + limit)
  const hasNext = collected.length > localStart + limit || upstreamHasNext
  return { total: null, limit, offset, hasPrevious: offset > 0, hasNext, results }
}

function toWork(item: OfficialWork): Work {
  return {
    provider: 'pixiv-comic',
    providerName: 'pixiv コミック',
    id: String(item.id),
    code: String(item.id),
    title: item.name,
    url: `${pixivComic.base}/works/${item.id}`,
    thumbnail: item.image.main,
    thumbnailAspectRatio: 5 / 7, // pixiv work covers are portrait
    language: 'ja',
    serializationStatus: 'unknown',
  }
}

// pixiv schedules updates on Japan Standard Time; format the current JST date as
// YYYY-MM-DD (the en-CA locale yields exactly that ordering).
function todayInTokyo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
