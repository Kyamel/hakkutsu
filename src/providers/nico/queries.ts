import { fetchText } from '../../lib/http.js'
import type { Work, WorksPage } from '../../types.js'
import type { Pagination } from '../types.js'
import { nico } from './config.js'

export interface RankingParams extends Pagination {
  rankType: string // 'point' (popularity) | 'view' (views)
  span: string // hourly | daily | weekly | monthly | total
  category: string // ranking category slug, e.g. 'shonen' or 'all'
}

// Each ranked work renders one anchor that bundles its id, cover and title:
//   <a href="/comic/{id}?track=rank" class="mg_thumb_img">
//     <img src="{thumb}" alt="{title}" ... />
// The page returns the full ranking (no real pagination), so we extract every
// item and slice the requested limit/offset window out of it client-side.
const ITEM_RE =
  /<a href="\/comic\/(\d+)[^"]*" class="mg_thumb_img">\s*<img src="([^"]+)" alt="([^"]*)"/g

// Browse a ranking page (genre + sort), mapped to the limit/offset contract.
export async function listRanking(params: RankingParams): Promise<WorksPage> {
  const url = `${nico.base}/ranking/${params.rankType}/${params.span}/${params.category}`
  const html = await fetchText(url, { headers: nico.headers })

  const all: Work[] = []
  for (const match of html.matchAll(ITEM_RE)) {
    all.push(toWork(match[1], match[2], match[3]))
  }

  const results = all.slice(params.offset, params.offset + params.limit)
  return {
    total: all.length,
    limit: params.limit,
    offset: params.offset,
    hasPrevious: params.offset > 0,
    hasNext: params.offset + params.limit < all.length,
    results,
  }
}

function toWork(id: string, thumbnail: string, rawTitle: string): Work {
  return {
    provider: 'nico',
    providerName: 'ニコニコ漫画',
    id,
    code: id,
    title: decodeEntities(rawTitle),
    url: `${nico.base}/comic/${id}`,
    thumbnail,
    thumbnailAspectRatio: 16 / 9, // ranking covers are 160x90 landscape
    language: 'ja',
    serializationStatus: 'unknown',
  }
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
}

function decodeEntities(text: string): string {
  return text.replace(/&(#?\w+);/g, (whole, name: string) => ENTITIES[name] ?? whole)
}
