import { Hono } from 'hono'
import { comicWalker, freeCategories, isFreeCategory, tagBySlug, tagList } from '../config.js'
import { listFree, listNew, searchByTag } from '../services/comicwalker.js'
import { findMatch } from '../services/matcher.js'

export const api = new Hono()

api.get('/tags', (c) => c.json(tagList))

api.get('/free/categories', (c) => c.json(freeCategories))

api.get('/works', async (c) => {
  const limit = clamp(int(c.req.query('limit'), 10), 1, 50)
  const offset = Math.max(0, int(c.req.query('offset'), 0))

  // Free library: branch to the free-campaign feed. `tag` is a free category
  // type; an unknown/absent one lists all free titles.
  if (c.req.query('free')) {
    const category = c.req.query('tag')
    const filterType = category && isFreeCategory(category) ? category : undefined
    return c.json(await listFree({ filterType, limit, offset }))
  }

  // Identify the tag by its id (with type) or, more conveniently, by slug.
  const slug = c.req.query('tag')
  const bySlug = slug ? tagBySlug(slug) : undefined
  const id = c.req.query('tagId') ?? bySlug?.id
  if (!id) return c.json({ error: 'tagId or tag (slug) is required' }, 400)
  const type = bySlug?.type ?? (c.req.query('type') === 'genre' ? 'genre' : 'tag')

  const requested = c.req.query('sortBy') ?? 'new'
  const sortBy = (comicWalker.sorts as readonly string[]).includes(requested) ? requested : 'new'

  return c.json(await searchByTag({ id, type, limit, offset, sortBy }))
})

api.get('/new', async (c) => {
  const limit = clamp(int(c.req.query('limit'), 10), 1, 50)
  const offset = Math.max(0, int(c.req.query('offset'), 0))
  return c.json(await listNew({ limit, offset, sortBy: comicWalker.newSort }))
})

api.get('/match', async (c) => {
  const title = c.req.query('title')
  if (!title) return c.json({ error: 'title is required' }, 400)
  return c.json(await findMatch(title))
})

function int(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
