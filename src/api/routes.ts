import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { findTaxonomyItem, findTaxonomyItems, getProvider, listProviders } from '../providers/index.js'
import type { ProviderRuntime } from '../providers/index.js'
import type { MangaProvider } from '../providers/types.js'
import { findMatch } from '../services/matcher.js'
import {
  ErrorSchema,
  MatchQuerySchema,
  MatchResultSchema,
  ProviderQuerySchema,
  ProviderSchema,
  TaxonomySchema,
  WorksPageSchema,
  WorksQuerySchema,
} from './schemas.js'

export interface ApiOptions {
  providerRuntime?: ProviderRuntime
}

export function createApi(options: ApiOptions = {}): OpenAPIHono {
  const api = new OpenAPIHono()
  const providerRuntime = options.providerRuntime ?? 'worker'

const json = <T>(schema: T) => ({
  content: {
    'application/json': {
      schema,
    },
  },
})

const providersRoute = createRoute({
  method: 'get',
  path: '/api/providers',
  tags: ['Metadata'],
  summary: 'List available manga providers',
  responses: {
    200: {
      ...json(ProviderSchema.array()),
      description: 'Available providers and their current capabilities.',
    },
  },
})

const taxonomyRoute = createRoute({
  method: 'get',
  path: '/api/taxonomy',
  tags: ['Metadata'],
  summary: 'List genres, tags, and sort options for a provider',
  request: {
    query: ProviderQuerySchema,
  },
  responses: {
    200: {
      ...json(TaxonomySchema),
      description: 'Provider taxonomy and sort options.',
    },
    400: {
      ...json(ErrorSchema),
      description: 'Unknown provider.',
    },
  },
})

const worksRoute = createRoute({
  method: 'get',
  path: '/api/works',
  tags: ['Works'],
  summary: 'Search works from a provider',
  request: {
    query: WorksQuerySchema,
  },
  responses: {
    200: {
      ...json(WorksPageSchema),
      description: 'Paginated provider works.',
    },
    400: {
      ...json(ErrorSchema),
      description: 'Missing or invalid provider/filter.',
    },
    502: {
      ...json(ErrorSchema),
      description: 'Provider upstream request failed.',
    },
  },
})

const matchRoute = createRoute({
  method: 'get',
  path: '/api/match',
  tags: ['MangaDex'],
  summary: 'Find the best MangaDex match for a provider title',
  request: {
    query: MatchQuerySchema,
  },
  responses: {
    200: {
      ...json(MatchResultSchema),
      description: 'Best MangaDex match and language availability.',
    },
    400: {
      ...json(ErrorSchema),
      description: 'Missing title.',
    },
    502: {
      ...json(ErrorSchema),
      description: 'MangaDex upstream request failed.',
    },
  },
})

  api.openapi(providersRoute, (c) => c.json(listProviders(providerRuntime), 200))

  api.openapi(taxonomyRoute, (c) => {
    const provider = providerFromQuery(c.req.valid('query').provider, providerRuntime)
    if (!provider) return c.json({ error: 'unknown provider' }, 400)
    return c.json({ provider: provider.summary, ...provider.taxonomy }, 200)
  })

  api.openapi(worksRoute, async (c) => {
    const query = c.req.valid('query')
    const provider = providerFromQuery(query.provider, providerRuntime)
    if (!provider) return c.json({ error: 'unknown provider' }, 400)

  const limit = query.limit ?? 10
  const offset = query.offset ?? 0

  // Genres accept comma-separated slugs (query.genre) and/or ids (query.genreId),
  // for multi-select providers; single-select providers just read the first.
  const genreIds = collectIds(provider, query.genre, query.genreId, 'genres')
  const excludeGenreIds = collectIds(provider, query.excludeGenre, query.excludeGenreId, 'genres')
  const genreId = genreIds[0]

  const tagBySlug = findTaxonomyItem(provider, query.tag, 'tags')
  const tagId = query.tagId ?? tagBySlug?.id
  const typeIds = collectIds(provider, query.type, undefined, 'types')

  const knownSort = provider.taxonomy.groups.some((group) =>
    group.sorts.some((sort) => sort.value === query.sortBy),
  )
  const sortBy = query.sortBy && knownSort ? query.sortBy : provider.defaultSort

  if (
    !genreId &&
    !tagId &&
    typeIds.length === 0 &&
    !query.feed &&
    provider.summary.capabilities.requiresFilter
  ) {
    return c.json({ error: 'genreId, genre, tagId, tag, type, or feed is required' }, 400)
  }

    return c.json(
      await provider.search({
        genreId,
        genreIds,
        excludeGenreIds,
        tagId,
        typeIds,
        year: query.year,
        feed: query.feed,
        limit,
        offset,
        sortBy,
      }),
      200,
    )
  })

  api.openapi(matchRoute, async (c) => {
    const { title } = c.req.valid('query')
    return c.json(await findMatch(title), 200)
  })

  return api
}

export const api = createApi()

function providerFromQuery(id: string | undefined, runtime: ProviderRuntime) {
  return getProvider(id, runtime)
}

// Merge taxonomy ids resolved from a comma-separated slug list with raw ids
// passed directly, de-duplicated and order-preserving.
function collectIds(
  provider: MangaProvider,
  slugCsv: string | undefined,
  idCsv: string | undefined,
  key: 'genres' | 'tags' | 'types',
): string[] {
  const fromSlugs = findTaxonomyItems(provider, slugCsv, key)
  const fromIds = idCsv
    ? idCsv.split(',').map((id) => id.trim()).filter(Boolean)
    : []
  return [...new Set([...fromSlugs, ...fromIds])]
}
