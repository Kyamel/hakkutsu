import type { MangaProvider, SortOption } from '../types.js'
import { browseGroup } from '../taxonomy.js'
import { comicWalkerFree } from './config.js'
import { listFree } from './queries.js'
import { comicWalkerFreeCategories } from './taxonomy.js'

// The "all" sentinel means "no category filter".
const ALL_TAG = 'all'
const categoryIds = new Set(
  comicWalkerFreeCategories.filter((item) => item.id !== ALL_TAG).map((item) => item.id),
)

const sorts: SortOption[] = [{ value: 'new', label: 'Recently updated', appliesTo: ['tags'] }]

export const comicWalkerFreeProvider: MangaProvider = {
  summary: {
    id: 'comicwalker-free',
    name: 'ComicWalker Free',
    site: comicWalkerFree.site,
    capabilities: {
      genres: false,
      tags: true,
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
    groups: [browseGroup('tags', 'Categories', comicWalkerFreeCategories, sorts)],
  },
  search: (params) => {
    const filterType = params.tagId && categoryIds.has(params.tagId) ? params.tagId : undefined
    return listFree({ filterType, limit: params.limit, offset: params.offset })
  },
}
