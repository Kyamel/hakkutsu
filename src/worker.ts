import { app } from './app.js'

interface Env {
  ASSETS: {
    fetch(request: Request): Response | Promise<Response>
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return handleApi(request, env, ctx)
    }

    return env.ASSETS.fetch(request)
  },
}

async function handleApi(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const ttl = cacheTtl(request)
  if (!ttl) return app.fetch(request, env, ctx)

  const cache = await caches.open('hakkutsu-api')
  const cacheKey = cacheRequest(request)
  const cached = await cache.match(cacheKey)
  if (cached) return withCacheHeaders(cached, 'HIT', ttl)

  const response = await app.fetch(request, env, ctx)
  if (response.status !== 200) return withCacheHeaders(response, 'BYPASS', ttl)

  const cacheable = withCacheHeaders(response, 'MISS', ttl)
  ctx.waitUntil(cache.put(cacheKey, cacheable.clone()))
  return cacheable
}

function cacheTtl(request: Request): number | null {
  if (request.method !== 'GET') return null

  const { pathname } = new URL(request.url)
  if (pathname === '/api/tags' || pathname === '/api/free/categories') return 86400
  if (pathname === '/api/openapi.json') return 86400
  if (pathname === '/api/works' || pathname === '/api/new') return 600
  if (pathname === '/api/match') return 21600
  return null
}

function cacheRequest(request: Request): Request {
  const url = new URL(request.url)
  url.searchParams.sort()
  return new Request(url.toString(), request)
}

function withCacheHeaders(response: Response, status: 'HIT' | 'MISS' | 'BYPASS', ttl: number): Response {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', status === 'BYPASS' ? 'no-store' : `public, max-age=${ttl}`)
  headers.set('X-Cache', status)
  headers.set('X-Cache-TTL', String(ttl))
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
