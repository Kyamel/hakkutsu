import type { MangaProvider, SortOption } from '../types.js'
import { comicWalkerFree } from './config.js'
import { listFree } from './queries.js'
import { comicWalkerFreeTaxonomy } from './taxonomy.js'

const tagIds = new Set(comicWalkerFreeTaxonomy.map((tag) => tag.id))

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
    const filterType = params.tag && tagIds.has(params.tag) ? params.tag : undefined
    return listFree({ filterType, limit: params.limit, offset: params.offset })
  },
}
