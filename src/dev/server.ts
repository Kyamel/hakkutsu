import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { app } from '../worker-app.js'

// Local dev entrypoint for Node. `wrangler dev` runs the Worker on workerd, which
// in some sandboxes rejects upstream TLS certs ("certificate is not trusted") and
// breaks every provider fetch; Node trusts them, so this serves the exact same
// Hono `app` over Node's HTTP/TLS stack. No caching here (that lives in the Worker
// and is Workers-only); assets come straight from ./public.
const dev = new Hono()
dev.route('/', app) // /api/* handled by the shared app
dev.use('/*', serveStatic({ root: './public' }))
dev.get('*', serveStatic({ path: './public/index.html' })) // SPA fallback

const port = Number(process.env.PORT) || 8787
serve({ fetch: dev.fetch, port }, (info) => {
  console.log(`hakkutsu dev (node) → http://localhost:${info.port}`)
})
