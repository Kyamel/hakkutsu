import { mangaDex, matchThreshold } from '../config.js'
import { mapLimit } from '../lib/async.js'
import { normalizeTitle, searchTerm, similarity } from '../lib/title.js'
import type { MatchResult } from '../types.js'
import { languageAvailability, searchManga, type MdManga } from './mangadex.js'

export async function findMatch(title: string): Promise<MatchResult> {
  const candidates = await searchManga(searchTerm(title))
  const best = pickBest(title, candidates)
  if (!best) return { query: title, matched: false }

  const languages = await mapLimit(
    best.manga.attributes.availableTranslatedLanguages ?? [],
    4,
    (lang) => languageAvailability(best.manga.id, lang),
  )
  languages.sort((a, b) => b.chapterCount - a.chapterCount)

  return {
    query: title,
    matched: true,
    manga: {
      id: best.manga.id,
      url: `${mangaDex.site}/title/${best.manga.id}`,
      title: displayTitle(best.manga),
      description: pickDescription(best.manga),
      confidence: Number(best.score.toFixed(2)),
      languages,
    },
  }
}

function pickBest(query: string, candidates: MdManga[]) {
  const fullTarget = normalizeTitle(query)
  const headTarget = normalizeTitle(searchTerm(query))
  let best: { manga: MdManga; score: number } | null = null
  for (const manga of candidates) {
    const score = Math.max(
      0,
      ...titleVariants(manga).map((t) => scoreVariant(t)),
    )
    if (!best || score > best.score) best = { manga, score }
  }
  return best && best.score >= matchThreshold ? best : null

  // Subtitles often differ between editions, so a strong main-title match
  // counts even when the full strings diverge.
  function scoreVariant(variant: string): number {
    const full = similarity(fullTarget, normalizeTitle(variant))
    const head = similarity(headTarget, normalizeTitle(searchTerm(variant)))
    return Math.max(full, 0.85 * head)
  }
}

function titleVariants(manga: MdManga): string[] {
  return [
    ...Object.values(manga.attributes.title),
    ...manga.attributes.altTitles.flatMap((alt) => Object.values(alt)),
  ]
}

function pickDescription(manga: MdManga): string | null {
  const desc = manga.attributes.description
  return desc.en ?? Object.values(desc)[0] ?? null
}

function displayTitle(manga: MdManga): string {
  const merged = Object.assign({}, ...manga.attributes.altTitles, manga.attributes.title)
  return (
    merged.en ??
    merged['ja-ro'] ??
    Object.values(manga.attributes.title)[0] ??
    'Untitled'
  )
}
