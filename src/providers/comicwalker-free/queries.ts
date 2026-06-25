import { fetchJson } from '../../lib/http.js'
import type { Work, WorksPage } from '../../types.js'
import { toPage } from '../pagination.js'
import type { Pagination } from '../types.js'
import { comicWalkerFree } from './config.js'

interface FreeResponse {
  pagination: { totalCount: number }
  resources: FreeItem[]
}

interface FreeItem {
  id: string
  code: string
  title: string
  thumbnail: string
  freeEpisodeCount: number
}

export interface ListFreeParams extends Pagination {
  filterType?: string
}

// Free titles, optionally narrowed to one of the free-campaign categories.
export async function listFree(params: ListFreeParams): Promise<WorksPage> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  })
  if (params.filterType) query.set('filterType', params.filterType)
  const data = await fetchJson<FreeResponse>(
    `${comicWalkerFree.base}/api/free-campaign?${query}`,
    { headers: comicWalkerFree.headers },
  )
  return toPage(data.pagination.totalCount, data.resources.map(toFreeWork), params)
}

function toFreeWork(item: FreeItem): Work {
  return {
    provider: 'comicwalker-free',
    providerName: 'ComicWalker Free',
    id: item.id,
    code: item.code,
    title: item.title,
    url: `${comicWalkerFree.base}/detail/${item.code}`,
    thumbnail: item.thumbnail,
    language: 'ja',
    serializationStatus: 'unknown',
    freeEpisodeCount: item.freeEpisodeCount,
  }
}
