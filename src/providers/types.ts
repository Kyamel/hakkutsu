import type { FreeCategory, TagInfo } from '../config.js'
import type { WorksPage } from '../types.js'

export interface ProviderSummary {
  id: string
  name: string
  site: string
  capabilities: {
    genres: boolean
    tags: boolean
    free: boolean
    new: boolean
    popularitySort: boolean
  }
}

export interface Pagination {
  limit: number
  offset: number
}

export interface SearchWorksParams extends Pagination {
  genreId?: string
  tagId?: string
  sortBy: string
}

export interface ListNewParams extends Pagination {
  sortBy: string
}

export interface ListFreeParams extends Pagination {
  filterType?: string
}

export interface MangaProvider {
  summary: ProviderSummary
  sorts: readonly string[]
  newSort: string
  tags(): TagInfo[]
  tagBySlug(slug: string): TagInfo | undefined
  freeCategories(): FreeCategory[]
  isFreeCategory(type: string): boolean
  searchWorks(params: SearchWorksParams): Promise<WorksPage>
  listNew(params: ListNewParams): Promise<WorksPage>
  listFree(params: ListFreeParams): Promise<WorksPage>
}
