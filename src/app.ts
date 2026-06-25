import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { api } from './api/routes.js'
import { HttpError } from './lib/http.js'

export function createApp(): OpenAPIHono {
  const app = new OpenAPIHono()

  app.route('/', api)
  app.doc('/api/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'hakkutsu API',
      version: '0.1.0',
      description: 'Manga discovery API backed by ComicWalker and MangaDex.',
    },
  })
  app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }))
  app.onError((err, c) => {
    const status = err instanceof HttpError ? err.status : 500
    return c.json({ error: err.message }, status)
  })

  return app
}

export const app = createApp()
