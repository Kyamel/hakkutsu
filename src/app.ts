import { Hono } from 'hono'
import { api } from './api/routes.js'
import { HttpError } from './lib/http.js'

export function createApp(): Hono {
  const app = new Hono()

  app.route('/api', api)
  app.onError((err, c) => {
    const status = err instanceof HttpError ? err.status : 500
    return c.json({ error: err.message }, status)
  })

  return app
}

export const app = createApp()
