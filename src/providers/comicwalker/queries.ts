import { fetchJson } from '../../lib/http.js'
import type { Work, WorksPage } from '../../types.js'
import { toPage } from '../pagination.js'
import type { Pagination } from '../types.js'
import { comicWalker } from './config.js'

interface CwResponse {
  total: number
  result: CwItem[]
}

interface CwItem {
  id: string
  code: string
  title: string
  thumbnail: string
  language: string
  serializationStatus: string
}

export interface SearchParams extends Pagination {
  genreId?: string
  tagId?: string
  sortBy: string
}

export interface ListNewParams extends Pagination {
  sortBy: string
}

export async function searchByTag(params: SearchParams): Promise<WorksPage> {
  // The endpoint accepts at most one genreId and one tagId together. Repeating
  // tagId only makes ComicWalker use the first one.
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    sortBy: params.sortBy,
  })
  if (params.genreId) query.set('genreId', params.genreId)
  if (params.tagId) query.set('tagId', params.tagId)
  return fetchPage(`${comicWalker.base}/api/search/genreOrTag?${query}`, params)
}

// Recently updated/published series, independent of any tag filter.
export async function listNew(params: ListNewParams): Promise<WorksPage> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    sortBy: params.sortBy,
  })
  return fetchPage(`${comicWalker.base}/api/series/new?${query}`, params)
}

async function fetchPage(url: string, page: Pagination): Promise<WorksPage> {
  const data = await fetchJson<CwResponse>(url, { headers: comicWalker.headers })
  return toPage(data.total, data.result.map(toWork), page)
}

function toWork(item: CwItem): Work {
  return {
    provider: 'comicwalker',
    providerName: 'ComicWalker',
    id: item.id,
    code: item.code,
    title: item.title,
    url: `${comicWalker.base}/detail/${item.code}`,
    thumbnail: item.thumbnail,
    language: item.language,
    serializationStatus: item.serializationStatus,
  }
}
