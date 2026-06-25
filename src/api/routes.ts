import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { getProvider, listProviders } from '../providers/index.js'
import { findMatch } from '../services/matcher.js'
import {
  ErrorSchema,
  FreeCategorySchema,
  MatchQuerySchema,
  MatchResultSchema,
  NewQuerySchema,
  ProviderSchema,
  ProviderQuerySchema,
  TagSchema,
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

const tagsRoute = createRoute({
  method: 'get',
  path: '/api/tags',
  tags: ['Metadata'],
  summary: 'List ComicWalker genres and tags',
  request: {
    query: ProviderQuerySchema,
  },
  responses: {
    200: {
      ...json(TagSchema.array()),
      description: 'Curated provider genres and tags with URL slugs.',
    },
    400: {
      ...json(ErrorSchema),
      description: 'Unknown provider.',
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

const freeCategoriesRoute = createRoute({
  method: 'get',
  path: '/api/free/categories',
  tags: ['Metadata'],
  summary: 'List free-campaign categories',
  request: {
    query: ProviderQuerySchema,
  },
  responses: {
    200: {
      ...json(FreeCategorySchema.array()),
      description: 'Provider free-campaign categories.',
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
  summary: 'List ComicWalker works by tag or free-campaign category',
  request: {
    query: WorksQuerySchema,
  },
  responses: {
    200: {
      ...json(WorksPageSchema),
      description: 'Paginated ComicWalker works.',
    },
    400: {
      ...json(ErrorSchema),
      description: 'Missing or invalid tag filter.',
    },
    502: {
      ...json(ErrorSchema),
      description: 'ComicWalker upstream request failed.',
    },
  },
})

const newRoute = createRoute({
  method: 'get',
  path: '/api/new',
  tags: ['Works'],
  summary: 'List recently updated ComicWalker works',
  request: {
    query: NewQuerySchema,
  },
  responses: {
    200: {
      ...json(WorksPageSchema),
      description: 'Paginated recently updated works.',
    },
    400: {
      ...json(ErrorSchema),
      description: 'Unknown provider.',
    },
    502: {
      ...json(ErrorSchema),
      description: 'ComicWalker upstream request failed.',
    },
  },
})

const matchRoute = createRoute({
  method: 'get',
  path: '/api/match',
  tags: ['MangaDex'],
  summary: 'Find the best MangaDex match for a ComicWalker title',
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

api.openapi(tagsRoute, (c) => {
  const provider = providerFromQuery(c.req.valid('query').provider)
  if (!provider) return c.json({ error: 'unknown provider' }, 400)
  return c.json(provider.tags(), 200)
})

api.openapi(freeCategoriesRoute, (c) => {
  const provider = providerFromQuery(c.req.valid('query').provider)
  if (!provider) return c.json({ error: 'unknown provider' }, 400)
  return c.json(provider.freeCategories(), 200)
})

api.openapi(worksRoute, async (c) => {
  const query = c.req.valid('query')
  const provider = providerFromQuery(query.provider)
  if (!provider) return c.json({ error: 'unknown provider' }, 400)
  const limit = query.limit ?? 10
  const offset = query.offset ?? 0

  // Free library: branch to the free-campaign feed. `tag` is a free category
  // type; an unknown/absent one lists all free titles.
  if (query.free) {
    const category = query.tag
    const filterType = category && provider.isFreeCategory(category) ? category : undefined
    return c.json(await provider.listFree({ filterType, limit, offset }), 200)
  }

  const genreBySlug = query.genre ? provider.tagBySlug(query.genre) : undefined
  const tagByQuerySlug = query.tag ? provider.tagBySlug(query.tag) : undefined
  // Backward compatibility: old URLs used `tag=<slug>` for both genres and
  // tags. New URLs use `genre=<slug>&tag=<slug>` when both are selected.
  const genreId =
    query.genreId ??
    (genreBySlug?.type === 'genre' ? genreBySlug.id : undefined) ??
    (!query.genre && tagByQuerySlug?.type === 'genre' ? tagByQuerySlug.id : undefined) ??
    (query.type === 'genre' ? query.tagId : undefined)
  const tagId =
    (query.type === 'genre' ? undefined : query.tagId) ??
    (tagByQuerySlug?.type === 'tag' ? tagByQuerySlug.id : undefined)

  if (!genreId && !tagId) return c.json({ error: 'genreId, genre, tagId, or tag is required' }, 400)

  const requested = query.sortBy ?? 'new'
  const sortBy = provider.sorts.includes(requested) ? requested : 'new'

  return c.json(await provider.searchWorks({ genreId, tagId, limit, offset, sortBy }), 200)
})

api.openapi(newRoute, async (c) => {
  const query = c.req.valid('query')
  const provider = providerFromQuery(query.provider)
  if (!provider) return c.json({ error: 'unknown provider' }, 400)
  const limit = query.limit ?? 10
  const offset = query.offset ?? 0
  return c.json(await provider.listNew({ limit, offset, sortBy: provider.newSort }), 200)
})

api.openapi(matchRoute, async (c) => {
  const { title } = c.req.valid('query')
  return c.json(await findMatch(title), 200)
})

function providerFromQuery(id: string | undefined) {
  return getProvider(id)
}
