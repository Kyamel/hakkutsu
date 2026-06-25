import type { MangaProvider, SortOption } from '../types.js'
import { browseGroup } from '../taxonomy.js'
import { nico } from './config.js'
import { listRanking } from './queries.js'
import { nicoCategories } from './taxonomy.js'

const categoryIds = new Set(nicoCategories.map((item) => item.id))

// Each sort value encodes `${rankType}-${span}` of the ranking URL, where
// rankType is `point` (popularity) or `view` (views).
const DEFAULT_SORT = 'point-weekly'
const sorts: SortOption[] = [
  { value: 'point-weekly', label: 'Popular (week)', appliesTo: ['genres'] },
  { value: 'point-monthly', label: 'Popular (month)', appliesTo: ['genres'] },
  { value: 'point-total', label: 'Popular (all-time)', appliesTo: ['genres'] },
  { value: 'view-weekly', label: 'Most viewed (week)', appliesTo: ['genres'] },
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
    const [rankType, span] = sort.split('-')
    return listRanking({
      rankType,
      span,
      category,
      limit: params.limit,
      offset: params.offset,
    })
  },
}
