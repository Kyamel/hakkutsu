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
      return app.fetch(request, env, ctx)
    }

    return env.ASSETS.fetch(request)
  },
}
