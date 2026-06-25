import type { MangaProvider, SortOption } from '../types.js'
import { comicWalker } from './config.js'
import { listNew, searchByTag } from './queries.js'
import { comicWalkerTaxonomy } from './taxonomy.js'

const newFeedSort = 'updateWithCutoff'

const sorts: SortOption[] = [
  { value: 'new', label: 'Recently updated', appliesTo: ['genre', 'tag'] },
  { value: 'popularity', label: 'Popularity', appliesTo: ['genre', 'tag'] },
]

export const comicWalkerProvider: MangaProvider = {
  summary: {
    id: 'comicwalker',
    name: 'ComicWalker',
    site: comicWalker.base,
    capabilities: {
      genres: true,
      tags: true,
      sorts,
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
    genres: comicWalkerTaxonomy.filter((item) => item.type === 'genre'),
    tags: comicWalkerTaxonomy.filter((item) => item.type === 'tag'),
    sorts,
  },
  search: (params) => {
    if (params.feed === 'new') {
      return listNew({ limit: params.limit, offset: params.offset, sortBy: newFeedSort })
    }
    return searchByTag(params)
  },
}
