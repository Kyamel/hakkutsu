import type { MangaProvider, SortOption } from '../types.js'
import { browseGroup, feedGroup } from '../taxonomy.js'
import { comicWalker } from './config.js'
import { listNew, searchByTag } from './queries.js'
import { comicWalkerGenres, comicWalkerTags } from './taxonomy.js'

const newFeedSort = 'updateWithCutoff'

const sorts: SortOption[] = [
  { value: 'new', label: 'Recently updated', appliesTo: ['genres', 'tags'] },
  { value: 'popularity', label: 'Popularity', appliesTo: ['genres', 'tags'] },
]

export const comicWalkerProvider: MangaProvider = {
  summary: {
    id: 'comicwalker',
    name: 'ComicWalker',
    site: comicWalker.base,
    capabilities: {
      genres: true,
      tags: true,
      new: true,
      requiresFilter: true,
    },
    ttl: {
      metadata: 86400,
      search: 600,
    },
  },
  defaultSort: 'new',
  taxonomy: {
    groups: [
      feedGroup('new', 'New releases'),
      browseGroup('genres', 'Genres', comicWalkerGenres, sorts),
      browseGroup('tags', 'Tags', comicWalkerTags, sorts),
    ],
  },
  search: (params) => {
    if (params.feed === 'new') {
      return listNew({ limit: params.limit, offset: params.offset, sortBy: newFeedSort })
    }
    return searchByTag(params)
  },
}
