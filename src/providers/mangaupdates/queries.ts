import { fetchJson } from '../../lib/http.js'
import type { Work, WorksPage } from '../../types.js'
import { toPage } from '../pagination.js'
import type { Pagination } from '../types.js'
import { mangaUpdates } from './config.js'

// MangaUpdates caps perpage; min observed is 5.
const PAGE_SIZE_MIN = 5
const PAGE_SIZE_MAX = 100

export interface ListSeriesParams extends Pagination {
  genreIds?: string[] // AND-ed include filter (genre names)
  excludeGenreIds?: string[] // exclude filter (genre names)
  typeIds?: string[] // content-format names, e.g. ["Manhwa","Manhua"]
  year?: string // exact release year
  orderby: string // rating | year | title
}

interface SearchResponse {
  total_hits: number
  results: { record: SeriesRecord }[]
}

interface SeriesRecord {
  series_id: number
  title: string
  url?: string
  type?: string
  year?: string
  bayesian_rating?: number
  image?: { url?: { original?: string; thumb?: string }; width?: number; height?: number }
}

// Browse the series database with the advanced filters, bridged to limit/offset.
// We control `perpage`, so we pick a page size covering the requested window,
// pull the pages spanning it, slice, and report the real total (capped at 10000).
export async function listSeries(params: ListSeriesParams): Promise<WorksPage> {
  const { limit, offset } = params
  const perpage = Math.min(Math.max(limit, PAGE_SIZE_MIN), PAGE_SIZE_MAX)
  const startPage = Math.floor(offset / perpage) + 1
  const localStart = offset % perpage
  const need = localStart + limit

  const collected: Work[] = []
  let total = 0
  for (let page = startPage; collected.length < need; page += 1) {
    const { works, totalHits } = await fetchSearchPage(params, page, perpage)
    total = totalHits
    collected.push(...works)
    if (works.length < perpage) break // last page
  }

  const results = collected.slice(localStart, localStart + limit)
  return toPage(total, results, { limit, offset })
}

async function fetchSearchPage(params: ListSeriesParams, page: number, perpage: number) {
  const body: Record<string, unknown> = { orderby: params.orderby, page, perpage }
  if (params.genreIds?.length) body.genre = params.genreIds
  if (params.excludeGenreIds?.length) body.exclude_genre = params.excludeGenreIds
  if (params.typeIds?.length) body.type = params.typeIds
  if (params.year) body.year = params.year

  const data = await fetchJson<SearchResponse>(`${mangaUpdates.base}/series/search`, {
    method: 'POST',
    headers: mangaUpdates.headers,
    body: JSON.stringify(body),
  })
  return {
    works: (data.results ?? []).map((entry) => toWork(entry.record)),
    totalHits: data.total_hits ?? 0,
  }
}

function toWork(record: SeriesRecord): Work {
  const id = String(record.series_id)
  const image = record.image
  const thumbnail = image?.url?.thumb ?? image?.url?.original ?? ''
  const aspectRatio =
    image?.width && image?.height ? image.width / image.height : 158 / 250 // MU covers are portrait
  return {
    provider: 'mangaupdates',
    providerName: 'MangaUpdates',
    id,
    code: id,
    title: record.title,
    url: record.url ?? `${mangaUpdates.site}/series/${id}`,
    thumbnail,
    thumbnailAspectRatio: aspectRatio,
    language: languageForType(record.type),
    serializationStatus: 'unknown', // not present on search results
    rating: record.bayesian_rating,
    year: record.year,
    type: record.type,
  }
}

// Origin language inferred from the content format.
function languageForType(type: string | undefined): string {
  switch (type) {
    case 'Manga':
      return 'ja'
    case 'Manhwa':
      return 'ko'
    case 'Manhua':
      return 'zh'
    default:
      return 'und'
  }
}
