import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { findTaxonomyItem, getProvider, listProviders } from '../providers/index.js'
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

export const api = new OpenAPIHono()

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

api.openapi(providersRoute, (c) => c.json(listProviders(), 200))

api.openapi(taxonomyRoute, (c) => {
  const provider = providerFromQuery(c.req.valid('query').provider)
  if (!provider) return c.json({ error: 'unknown provider' }, 400)
  return c.json({ provider: provider.summary, ...provider.taxonomy }, 200)
})

api.openapi(worksRoute, async (c) => {
  const query = c.req.valid('query')
  const provider = providerFromQuery(query.provider)
  if (!provider) return c.json({ error: 'unknown provider' }, 400)

  const limit = query.limit ?? 10
  const offset = query.offset ?? 0
  const genreBySlug = findTaxonomyItem(provider, query.genre, 'genre')
  const tagBySlug = findTaxonomyItem(provider, query.tag, 'tag')
  const genreId = query.genreId ?? genreBySlug?.id
  const tagId = query.tagId ?? tagBySlug?.id
  const sortBy =
    query.sortBy && provider.taxonomy.sorts.some((sort) => sort.value === query.sortBy)
      ? query.sortBy
      : provider.defaultSort

  if (!genreId && !tagId && !query.feed && provider.summary.capabilities.requiresFilter) {
    return c.json({ error: 'genreId, genre, tagId, tag, or feed is required' }, 400)
  }

  return c.json(
    await provider.search({
      genreId,
      tagId,
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

function providerFromQuery(id: string | undefined) {
  return getProvider(id)
}
