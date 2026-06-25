import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { comicWalker, freeCategories, isFreeCategory, tagBySlug, tagList } from '../config.js'
import { listFree, listNew, searchByTag } from '../services/comicwalker.js'
import { findMatch } from '../services/matcher.js'
import {
  ErrorSchema,
  FreeCategorySchema,
  MatchQuerySchema,
  MatchResultSchema,
  NewQuerySchema,
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
  responses: {
    200: {
      ...json(TagSchema.array()),
      description: 'Curated ComicWalker genres and tags with URL slugs.',
    },
  },
})

const freeCategoriesRoute = createRoute({
  method: 'get',
  path: '/api/free/categories',
  tags: ['Metadata'],
  summary: 'List free-campaign categories',
  responses: {
    200: {
      ...json(FreeCategorySchema.array()),
      description: 'ComicWalker free-campaign categories.',
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

api.openapi(tagsRoute, (c) => c.json(tagList, 200))

api.openapi(freeCategoriesRoute, (c) => c.json(freeCategories, 200))

api.openapi(worksRoute, async (c) => {
  const query = c.req.valid('query')
  const limit = query.limit ?? 10
  const offset = query.offset ?? 0

  // Free library: branch to the free-campaign feed. `tag` is a free category
  // type; an unknown/absent one lists all free titles.
  if (query.free) {
    const category = query.tag
    const filterType = category && isFreeCategory(category) ? category : undefined
    return c.json(await listFree({ filterType, limit, offset }), 200)
  }

  // Identify the tag by its id (with type) or, more conveniently, by slug.
  const slug = query.tag
  const bySlug = slug ? tagBySlug(slug) : undefined
  const id = query.tagId ?? bySlug?.id
  if (!id) return c.json({ error: 'tagId or tag (slug) is required' }, 400)
  const type = bySlug?.type ?? (query.type === 'genre' ? 'genre' : 'tag')

  const requested = query.sortBy ?? 'new'
  const sortBy = (comicWalker.sorts as readonly string[]).includes(requested) ? requested : 'new'

  return c.json(await searchByTag({ id, type, limit, offset, sortBy }), 200)
})

api.openapi(newRoute, async (c) => {
  const query = c.req.valid('query')
  const limit = query.limit ?? 10
  const offset = query.offset ?? 0
  return c.json(await listNew({ limit, offset, sortBy: comicWalker.newSort }), 200)
})

api.openapi(matchRoute, async (c) => {
  const { title } = c.req.valid('query')
  return c.json(await findMatch(title), 200)
})
