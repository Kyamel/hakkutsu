import type { WorksPage } from '../types.js'

export interface TaxonomyItem {
  id: string
  name: string
  label: string
  type: 'genre' | 'tag'
  slug: string
}

// Browsing dimensions a sort can apply to; an empty subset is never used.
export type SortScope = 'genre' | 'tag'

export interface SortOption {
  value: string
  label: string
  appliesTo: SortScope[]
}

export interface ProviderTaxonomy {
  genres: TaxonomyItem[]
  tags: TaxonomyItem[]
  sorts: SortOption[]
}

export interface ProviderSummary {
  id: string
  name: string
  site: string
  capabilities: {
    genres: boolean
    tags: boolean
    sorts: SortOption[]
    new: boolean
    requiresFilter: boolean
  }
  ttl: {
    metadata: number
    search: number
  }
}

export interface Pagination {
  limit: number
  offset: number
}

export interface SearchWorksParams extends Pagination {
  genreId?: string
  tagId?: string
  feed?: string
  sortBy: string
}

export interface MangaProvider {
  summary: ProviderSummary
  defaultSort: string
  taxonomy: ProviderTaxonomy
  search(params: SearchWorksParams): Promise<WorksPage>
}
