import { mangaDex } from '../config.js'
import { fetchJson } from '../lib/http.js'
import type { LanguageAvailability } from '../types.js'

export interface MdManga {
  id: string
  attributes: {
    title: Record<string, string>
    altTitles: Record<string, string>[]
    description: Record<string, string>
    availableTranslatedLanguages: string[]
  }
}

interface MdSearchResponse {
  data: MdManga[]
}

interface MdChapterResponse {
  total: number
  data: { attributes: { readableAt: string } }[]
}

export async function searchManga(title: string, limit = 5): Promise<MdManga[]> {
  const query = new URLSearchParams({ title, limit: String(limit) })
  const data = await fetchJson<MdSearchResponse>(
    `${mangaDex.base}/manga?${query}`,
    { headers: mangaDex.headers },
  )
  return data.data
}

// Chapter count and newest chapter date for one translated language.
export async function languageAvailability(
  mangaId: string,
  language: string,
): Promise<LanguageAvailability> {
  const query = new URLSearchParams({
    manga: mangaId,
    'translatedLanguage[]': language,
    limit: '1',
    'order[readableAt]': 'desc',
  })
  const data = await fetchJson<MdChapterResponse>(
    `${mangaDex.base}/chapter?${query}`,
    { headers: mangaDex.headers },
  )
  return {
    language,
    chapterCount: data.total,
    latestChapterAt: data.data[0]?.attributes.readableAt ?? null,
  }
}
