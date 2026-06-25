// A work as surfaced by comic-walker search.
export interface Work {
  id: string
  code: string
  title: string // Japanese title
  url: string // comic-walker detail page
  thumbnail: string
  language: string
  serializationStatus: string
  freeEpisodeCount?: number // present only for free-campaign results
}

export interface WorksPage {
  total: number // total works for the tag, across all pages
  limit: number // page size
  offset: number // index of the first item in this page
  hasPrevious: boolean
  hasNext: boolean
  results: Work[]
}

// Translation availability for one language on MangaDex.
export interface LanguageAvailability {
  language: string // ISO-ish code, e.g. "en", "pt-br"
  chapterCount: number
  latestChapterAt: string | null // ISO timestamp of the newest chapter
}

export interface MangaMatch {
  id: string
  url: string
  title: string // best human-readable title (English/romaji when available)
  description: string | null // English when available, else any language
  confidence: number // 0..1 similarity against the queried title
  languages: LanguageAvailability[]
}

export interface MatchResult {
  query: string
  matched: boolean
  manga?: MangaMatch
}
