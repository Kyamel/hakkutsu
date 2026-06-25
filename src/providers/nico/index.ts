import type { MangaProvider, SortOption } from '../types.js'
import { browseGroup } from '../taxonomy.js'
import { nico } from './config.js'
import { listCatalog } from './queries.js'
import { nicoCategories } from './taxonomy.js'

const categoryIds = new Set(nicoCategories.map((item) => item.id))

// Sort values are the catalog's own `sort` query parameter.
const DEFAULT_SORT = 'manga_favorite'
const sorts: SortOption[] = [
  { value: 'manga_favorite', label: 'Most favorited', appliesTo: ['genres'] },
  { value: 'view', label: 'Most viewed', appliesTo: ['genres'] },
  { value: 'manga_updated', label: 'Recently updated', appliesTo: ['genres'] },
  { value: 'manga_created', label: 'Newest', appliesTo: ['genres'] },
  { value: 'comment_created', label: 'Recently commented', appliesTo: ['genres'] },
]
const sortValues = new Set(sorts.map((sort) => sort.value))

export const nicoProvider: MangaProvider = {
  summary: {
    id: 'nico',
    name: 'ニコニコ漫画',
    site: nico.site,
    capabilities: {
      genres: true,
      tags: false,
      new: false,
      types: false,
      year: false,
      requiresFilter: false,
    },
    ttl: {
      metadata: 86400,
      search: 600,
    },
  },
  defaultSort: DEFAULT_SORT,
  taxonomy: {
    groups: [browseGroup('genres', 'Categories', nicoCategories, sorts)],
  },
  search: (params) => {
    const category = params.genreId && categoryIds.has(params.genreId) ? params.genreId : 'all'
    const sort = params.sortBy && sortValues.has(params.sortBy) ? params.sortBy : DEFAULT_SORT
    return listCatalog({ category, sort, limit: params.limit, offset: params.offset })
  },
}
