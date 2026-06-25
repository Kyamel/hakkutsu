import type { MangaProvider, SortOption } from '../types.js'
import { browseGroup, feedGroup } from '../taxonomy.js'
import { pixivComic } from './config.js'
import { listByCategory, listRecent } from './queries.js'
import { pixivComicCategories } from './taxonomy.js'

const categoryIds = new Set(pixivComicCategories.map((item) => item.id))

// "Recently updated" also applies to the New feed: picking a category and this
// sort yields the recent feed narrowed by that category.
const UPDATED = 'updated'
const genreSorts: SortOption[] = [
  { value: 'popular', label: 'Popular', appliesTo: ['genres'] },
  { value: UPDATED, label: 'Recently updated', appliesTo: ['genres', 'new'] },
]

export const pixivComicProvider: MangaProvider = {
  summary: {
    id: 'pixiv-comic',
    name: 'pixiv コミック',
    site: pixivComic.base,
    capabilities: {
      genres: true,
      tags: false,
      new: true,
      requiresFilter: true,
    },
    ttl: {
      metadata: 86400,
      search: 600,
    },
  },
  defaultSort: 'popular',
  taxonomy: {
    groups: [
      feedGroup('new', 'New releases'),
      browseGroup('genres', 'Genres', pixivComicCategories, genreSorts),
    ],
  },
  search: (params) => {
    const page = { limit: params.limit, offset: params.offset }
    // Bare New feed: every recently updated series.
    if (params.feed === 'new') return listRecent(page)
    if (params.genreId && categoryIds.has(params.genreId)) {
      // Category + "Recently updated" → recent feed filtered by that category.
      if (params.sortBy === UPDATED) return listRecent(page, params.genreId)
      return listByCategory(params.genreId, page)
    }
    // No usable filter: fall back to the recent feed rather than erroring.
    return listRecent(page)
  },
}
