import { swaggerUI } from '@hono/swagger-ui'
import { createApp } from './app.js'

export const app = createApp({
  configureDocs(app) {
    app.doc('/api/openapi.json', {
      openapi: '3.1.0',
      info: {
        title: 'hakkutsu API',
        version: '0.1.0',
        description: 'Manga discovery API backed by ComicWalker and MangaDex.',
      },
    })
    app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }))
  },
})
