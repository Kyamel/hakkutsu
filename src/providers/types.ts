import type { WorksPage } from '../types.js'

export interface TaxonomyItem {
  id: string // identifier the provider sends upstream
  name: string // native (Japanese) name
  label: string // English label
  slug: string // derived from label, used in URL state
}

// Browsing dimensions a provider can expose; each key doubles as a capability
// flag. A sort declares which dimensions it applies to via these keys.
export type BrowseKey = 'genres' | 'tags' | 'new' | 'types'

export interface SortOption {
  value: string
  label: string
  appliesTo: BrowseKey[]
}

// One row of the picker. `browse` groups list items you navigate into; `feed`
// groups are a toggleable feed whose items (if any) act as secondary filters.
export interface BrowseGroup {
  key: BrowseKey
  label: string
  mode: 'browse' | 'feed'
  // browse: the works-query param an item id maps to.
  // feed: the param a secondary-filter item maps to (omitted for a bare toggle).
  param?: 'genreId' | 'tagId' | 'type'
  // browse groups only: the UI may select several items at once...
  multiSelect?: boolean
  // ...and may let each item be negated (e.g. exclude a genre).
  supportsExclude?: boolean
  items: TaxonomyItem[]
  sorts: SortOption[]
}

export interface ProviderTaxonomy {
  groups: BrowseGroup[]
}

export interface ProviderSummary {
  id: string
  name: string
  site: string
  capabilities: {
    genres: boolean
    tags: boolean
    new: boolean
    types: boolean
    year: boolean
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
  genreIds?: string[] // multi-select include (advanced providers)
  excludeGenreIds?: string[] // genres to exclude (advanced providers)
  tagId?: string
  typeIds?: string[] // content-format filter (multi-select)
  year?: string // exact release year filter
  feed?: string
  sortBy: string
}

export interface MangaProvider {
  summary: ProviderSummary
  defaultSort: string
  taxonomy: ProviderTaxonomy
  search(params: SearchWorksParams): Promise<WorksPage>
}
