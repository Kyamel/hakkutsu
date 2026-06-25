import type { MangaProvider, SortOption } from '../types.js'
import { browseGroup, typesGroup } from '../taxonomy.js'
import { mangaUpdates } from './config.js'
import { listSeries } from './queries.js'
import { mangaUpdatesGenres, mangaUpdatesTypes } from './taxonomy.js'

// Sort values are MangaUpdates' own `orderby` query parameter.
const DEFAULT_SORT = 'rating'
const sorts: SortOption[] = [
  { value: 'rating', label: 'Rating', appliesTo: ['genres', 'types'] },
  { value: 'year', label: 'Year', appliesTo: ['genres', 'types'] },
  { value: 'title', label: 'Title', appliesTo: ['genres', 'types'] },
]
const sortValues = new Set(sorts.map((sort) => sort.value))

export const mangaUpdatesProvider: MangaProvider = {
  summary: {
    id: 'mangaupdates',
    name: 'MangaUpdates',
    site: mangaUpdates.site,
    capabilities: {
      genres: true,
      tags: false,
      new: false,
      types: true,
      year: true,
      requiresFilter: false,
    },
    ttl: {
      metadata: 86400,
      search: 600,
    },
  },
  defaultSort: DEFAULT_SORT,
  taxonomy: {
    groups: [
      browseGroup('genres', 'Genres', mangaUpdatesGenres, sorts, {
        multiSelect: true,
        supportsExclude: true,
      }),
      typesGroup('Type', mangaUpdatesTypes, sorts, { multiSelect: true }),
    ],
  },
  search: (params) => {
    const orderby = params.sortBy && sortValues.has(params.sortBy) ? params.sortBy : DEFAULT_SORT
    return listSeries({
      genreIds: params.genreIds,
      excludeGenreIds: params.excludeGenreIds,
      typeIds: params.typeIds,
      year: params.year,
      orderby,
      limit: params.limit,
      offset: params.offset,
    })
  },
}
