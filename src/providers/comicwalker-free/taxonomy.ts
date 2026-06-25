import { defineTaxonomy } from '../taxonomy.js'

// The free-campaign feed has its own (smaller) category set, keyed by string
// `type` rather than the regular ComicWalker genre/tag UUIDs. The leading "all"
// item is a sentinel that lists every free title (no category filter).
export const comicWalkerFreeCategories = defineTaxonomy([
  { id: 'all', name: '総合', label: 'All' },
  { id: 'fantasy', name: 'ファンタジー', label: 'Fantasy' },
  { id: 'romance', name: '恋愛', label: 'Romance' },
  { id: 'romcom', name: 'ラブコメ', label: 'Romcom' },
  { id: 'isekai', name: '異世界・転生', label: 'Isekai' },
  { id: 'comedy', name: 'ギャグ・コメディ', label: 'Comedy' },
  { id: 'action', name: 'バトル・アクション', label: 'Action' },
  { id: 'horror', name: 'ホラー・ミステリー・サスペンス', label: 'Horror/Mystery' },
  { id: 'sf', name: 'ロボット・SF', label: 'Sci-Fi' },
  { id: 'yuri', name: '百合', label: 'Yuri' },
  { id: 'bl', name: 'BL', label: 'BL' },
  { id: 'gourmet', name: 'グルメ', label: 'Gourmet' },
  { id: 'slice_of_life', name: '日常系', label: 'Slice of life' },
])
