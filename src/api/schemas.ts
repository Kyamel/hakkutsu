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
    appliesTo: z.array(z.enum(['genres', 'tags', 'new', 'types'])).openapi({
      example: ['genres', 'tags'],
      description: 'Browsing dimensions this sort applies to (capability keys).',
    }),
  })
  .openapi('SortOption')

export const BrowseGroupSchema = z
  .object({
    key: z.enum(['genres', 'tags', 'new', 'types']).openapi({
      example: 'genres',
    }),
    label: z.string().openapi({
      example: 'Genres',
    }),
    mode: z.enum(['browse', 'feed']).openapi({
      example: 'browse',
      description: '"browse" lists items to navigate into; "feed" is a toggleable feed.',
    }),
    param: z.enum(['genreId', 'tagId', 'type']).optional().openapi({
      example: 'genreId',
      description: 'Works-query param an item maps to (secondary filter for feed groups).',
    }),
    multiSelect: z.boolean().optional().openapi({
      example: true,
      description: 'Browse group whose items can be selected several at once.',
    }),
    supportsExclude: z.boolean().optional().openapi({
      example: true,
      description: 'Browse group whose items can be negated (excluded).',
    }),
    items: z.array(TaxonomyItemSchema),
    sorts: z.array(SortOptionSchema),
  })
  .openapi('BrowseGroup')

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
      new: z.boolean().openapi({
        example: true,
      }),
      types: z.boolean().openapi({
        example: false,
      }),
      year: z.boolean().openapi({
        example: false,
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
    groups: z.array(BrowseGroupSchema),
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
    thumbnailAspectRatio: z.number().positive().optional().openapi({
      example: 1.7778,
      description: 'Cover width/height, so the client can size art without guessing.',
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
    rating: z.number().min(0).max(10).optional().openapi({
      example: 7.69,
      description: 'Global community rating 0..10 (distinct from JP popularity).',
    }),
    year: z.string().optional().openapi({
      example: '1999',
    }),
    type: z.string().optional().openapi({
      example: 'Manga',
    }),
    freeEpisodeCount: z.number().int().optional().openapi({
      example: 3,
    }),
  })
  .openapi('Work')

export const WorksPageSchema = z
  .object({
    total: z.number().int().nullable().openapi({
      example: 123,
      description: 'Total works across all pages, or null when the provider exposes no count.',
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
    example: 'action,romance',
    description: 'Genre slug(s), comma-separated for multi-select providers.',
  }),
  genreId: z.string().optional().openapi({
    param: {
      name: 'genreId',
      in: 'query',
    },
    example: '018a262f-986a-7cca-8c8e-4c8d4b229a94',
    description: 'Genre id(s), comma-separated for multi-select providers.',
  }),
  excludeGenre: z.string().optional().openapi({
    param: {
      name: 'excludeGenre',
      in: 'query',
    },
    example: 'yaoi,yuri',
    description: 'Genre slug(s) to exclude, comma-separated.',
  }),
  excludeGenreId: z.string().optional().openapi({
    param: {
      name: 'excludeGenreId',
      in: 'query',
    },
    example: '',
    description: 'Genre id(s) to exclude, comma-separated.',
  }),
  type: z.string().optional().openapi({
    param: {
      name: 'type',
      in: 'query',
    },
    example: 'manhwa,manhua',
    description: 'Content-format filter; slug(s), comma-separated for multi-select.',
  }),
  year: z.string().optional().openapi({
    param: {
      name: 'year',
      in: 'query',
    },
    example: '2020',
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
