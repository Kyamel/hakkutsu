// A work as surfaced by a Japanese manga provider.
export interface Work {
  provider: string
  providerName: string
  id: string
  code: string
  title: string // Japanese title
  url: string // provider detail page
  thumbnail: string
  thumbnailAspectRatio?: number // cover width/height, so the client can size art without guessing
  language: string
  serializationStatus: string
  publisher?: string
  popularityJp?: number // normalized 0..10 when the provider exposes a usable popularity signal
  rating?: number // global community rating 0..10 (distinct from JP popularity)
  year?: string // year of first release, when the provider exposes it
  type?: string // content format, e.g. "Manga", "Manhwa", "Novel"
  freeEpisodeCount?: number // present only for free-campaign results
}

export interface WorksPage {
  total: number | null // total works across all pages; null when the provider exposes no count
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
