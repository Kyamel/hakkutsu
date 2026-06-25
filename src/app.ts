import { OpenAPIHono } from '@hono/zod-openapi'
import { createApi } from './api/routes.js'
import { HttpError } from './lib/http.js'
import type { ProviderRuntime } from './providers/index.js'

export interface AppOptions {
  providerRuntime?: ProviderRuntime
  configureDocs?: (app: OpenAPIHono) => void
}

export function createApp(options: AppOptions = {}): OpenAPIHono {
  const app = new OpenAPIHono()

  app.route('/', createApi({ providerRuntime: options.providerRuntime ?? 'worker' }))
  options.configureDocs?.(app)

  app.onError((err, c) => {
    const status = err instanceof HttpError ? err.status : 500
    return c.json({ error: err.message }, status)
  })

  return app
}
