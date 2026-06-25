import type { MangaProvider, SortOption } from '../types.js'
import { comicWalkerFree } from './config.js'
import { listFree } from './queries.js'
import { comicWalkerFreeTaxonomy } from './taxonomy.js'

// Real category ids (the "all" sentinel means "no filter").
const ALL_TAG = 'all'
const categoryIds = new Set(
  comicWalkerFreeTaxonomy.filter((tag) => tag.id !== ALL_TAG).map((tag) => tag.id),
)

const sorts: SortOption[] = [{ value: 'new', label: 'Recently updated', appliesTo: ['tag'] }]

export const comicWalkerFreeProvider: MangaProvider = {
  summary: {
    id: 'comicwalker-free',
    name: 'ComicWalker Free',
    site: comicWalkerFree.site,
    capabilities: {
      genres: false,
      tags: true,
      sorts,
      new: false,
      requiresFilter: false,
    },
    ttl: {
      metadata: 86400,
      search: 600,
    },
  },
  defaultSort: 'new',
  taxonomy: {
    genres: [],
    tags: comicWalkerFreeTaxonomy,
    sorts,
  },
  search: (params) => {
    const filterType = params.tagId && categoryIds.has(params.tagId) ? params.tagId : undefined
    return listFree({ filterType, limit: params.limit, offset: params.offset })
  },
}
