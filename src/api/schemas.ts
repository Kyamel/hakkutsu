import { z } from '@hono/zod-openapi'

export const ErrorSchema = z
  .object({
    error: z.string().openapi({
      example: 'tagId or tag (slug) is required',
    }),
  })
  .openapi('Error')

export const TaxonomyItemSchema = z
  .object({
    id: z.string().openapi({
      example: '018a262f-986a-7cca-8c8e-4c8d4b229a94',
    }),
    name: z.string().openapi({
      example: 'ファンタジー',
    }),
    label: z.string().openapi({
      example: 'Fantasy',
    }),
    type: z.enum(['genre', 'tag']).openapi({
      example: 'genre',
    }),
    slug: z.string().openapi({
      example: 'fantasy',
    }),
  })
  .openapi('TaxonomyItem')

export const SortOptionSchema = z
  .object({
    value: z.string().openapi({
      example: 'new',
    }),
    label: z.string().openapi({
      example: 'Recently updated',
    }),
    appliesTo: z.array(z.enum(['genre', 'tag'])).openapi({
      example: ['genre', 'tag'],
      description: 'Browsing dimensions this sort applies to.',
    }),
  })
  .openapi('SortOption')

export const ProviderSchema = z
  .object({
    id: z.string().openapi({
      example: 'comicwalker',
    }),
    name: z.string().openapi({
      example: 'ComicWalker',
    }),
    site: z.url().openapi({
      example: 'https://comic-walker.com',
    }),
    capabilities: z.object({
      genres: z.boolean().openapi({
        example: true,
      }),
      tags: z.boolean().openapi({
        example: true,
      }),
      sorts: SortOptionSchema.array().openapi({
        example: [
          { value: 'new', label: 'Recently updated' },
          { value: 'popularity', label: 'Popularity' },
        ],
      }),
      new: z.boolean().openapi({
        example: true,
      }),
      requiresFilter: z.boolean().openapi({
        example: true,
      }),
    }),
    ttl: z.object({
      metadata: z.number().int().openapi({
        example: 86400,
      }),
      search: z.number().int().openapi({
        example: 600,
      }),
    }),
  })
  .openapi('Provider')

export const TaxonomySchema = z
  .object({
    provider: ProviderSchema,
    genres: z.array(TaxonomyItemSchema),
    tags: z.array(TaxonomyItemSchema),
    sorts: z.array(SortOptionSchema),
  })
  .openapi('Taxonomy')

export const WorkSchema = z
  .object({
    provider: z.string().openapi({
      example: 'comicwalker',
    }),
    providerName: z.string().openapi({
      example: 'ComicWalker',
    }),
    id: z.string().openapi({
      example: '018a8d8a-1dc5-7b3d-9b69-000000000000',
    }),
    code: z.string().openapi({
      example: 'KDCW_FS01200041010000_68',
    }),
    title: z.string().openapi({
      example: 'ダンジョン飯',
    }),
    url: z.url().openapi({
      example: 'https://comic-walker.com/detail/KDCW_FS01200041010000_68',
    }),
    thumbnail: z.string().openapi({
      example: 'https://cdn.comic-walker.com/cover/example.jpg',
    }),
    language: z.string().openapi({
      example: 'ja',
    }),
    serializationStatus: z.string().openapi({
      example: 'serialization',
    }),
    publisher: z.string().optional().openapi({
      example: 'Kadokawa',
    }),
    popularityJp: z.number().min(0).max(10).optional().openapi({
      example: 8.7,
    }),
    freeEpisodeCount: z.number().int().optional().openapi({
      example: 3,
    }),
  })
  .openapi('Work')

export const WorksPageSchema = z
  .object({
    total: z.number().int().openapi({
      example: 123,
    }),
    limit: z.number().int().openapi({
      example: 10,
    }),
    offset: z.number().int().openapi({
      example: 0,
    }),
    hasPrevious: z.boolean().openapi({
      example: false,
    }),
    hasNext: z.boolean().openapi({
      example: true,
    }),
    results: z.array(WorkSchema),
  })
  .openapi('WorksPage')

export const LanguageAvailabilitySchema = z
  .object({
    language: z.string().openapi({
      example: 'en',
    }),
    chapterCount: z.number().int().openapi({
      example: 42,
    }),
    latestChapterAt: z.string().nullable().openapi({
      example: '2026-06-25T00:00:00+00:00',
    }),
  })
  .openapi('LanguageAvailability')

export const MangaMatchSchema = z
  .object({
    id: z.string().openapi({
      example: 'e6b7d4a4-4d6b-4b4b-8f1d-000000000000',
    }),
    url: z.url().openapi({
      example: 'https://mangadex.org/title/e6b7d4a4-4d6b-4b4b-8f1d-000000000000',
    }),
    title: z.string().openapi({
      example: 'Delicious in Dungeon',
    }),
    description: z.string().nullable().openapi({
      example: 'A fantasy cooking adventure.',
    }),
    confidence: z.number().min(0).max(1).openapi({
      example: 0.94,
    }),
    languages: z.array(LanguageAvailabilitySchema),
  })
  .openapi('MangaMatch')

export const MatchResultSchema = z
  .object({
    query: z.string().openapi({
      example: 'ダンジョン飯',
    }),
    matched: z.boolean().openapi({
      example: true,
    }),
    manga: MangaMatchSchema.optional(),
  })
  .openapi('MatchResult')

const limitQuery = z.coerce.number().int().min(1).max(50).optional().openapi({
  param: {
    name: 'limit',
    in: 'query',
  },
  example: 10,
})

const offsetQuery = z.coerce.number().int().min(0).optional().openapi({
  param: {
    name: 'offset',
    in: 'query',
  },
  example: 0,
})

export const ProviderQuerySchema = z.object({
  provider: z.string().optional().openapi({
    param: {
      name: 'provider',
      in: 'query',
    },
    example: 'comicwalker',
  }),
})

export const WorksQuerySchema = z.object({
  provider: z.string().optional().openapi({
    param: {
      name: 'provider',
      in: 'query',
    },
    example: 'comicwalker',
  }),
  limit: limitQuery,
  offset: offsetQuery,
  genre: z.string().optional().openapi({
    param: {
      name: 'genre',
      in: 'query',
    },
    example: 'fantasy',
  }),
  genreId: z.string().optional().openapi({
    param: {
      name: 'genreId',
      in: 'query',
    },
    example: '018a262f-986a-7cca-8c8e-4c8d4b229a94',
  }),
  tag: z.string().optional().openapi({
    param: {
      name: 'tag',
      in: 'query',
    },
    example: 'isekai',
  }),
  tagId: z.string().optional().openapi({
    param: {
      name: 'tagId',
      in: 'query',
    },
    example: '018b8a02-f3dc-7095-a085-45594e3008b7',
  }),
  sortBy: z.string().optional().openapi({
    param: {
      name: 'sortBy',
      in: 'query',
    },
    example: 'new',
  }),
  feed: z.string().optional().openapi({
    param: {
      name: 'feed',
      in: 'query',
    },
    example: 'new',
  }),
})

export const MatchQuerySchema = z.object({
  title: z.string().min(1).openapi({
    param: {
      name: 'title',
      in: 'query',
    },
    example: 'ダンジョン飯',
  }),
})
