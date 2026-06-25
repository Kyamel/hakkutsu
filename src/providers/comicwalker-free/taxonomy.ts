import { defineTaxonomy } from '../taxonomy.js'

// The free-campaign feed has its own (smaller) category set, keyed by string
// `type` rather than the regular ComicWalker genre/tag UUIDs. The leading "all"
// tag is a sentinel that lists every free title (no category filter).
export const comicWalkerFreeTaxonomy = defineTaxonomy([
  { id: 'all', name: '総合', label: 'All', type: 'tag' },
  { id: 'fantasy', name: 'ファンタジー', label: 'Fantasy', type: 'tag' },
  { id: 'romance', name: '恋愛', label: 'Romance', type: 'tag' },
  { id: 'romcom', name: 'ラブコメ', label: 'Romcom', type: 'tag' },
  { id: 'isekai', name: '異世界・転生', label: 'Isekai', type: 'tag' },
  { id: 'comedy', name: 'ギャグ・コメディ', label: 'Comedy', type: 'tag' },
  { id: 'action', name: 'バトル・アクション', label: 'Action', type: 'tag' },
  { id: 'horror', name: 'ホラー・ミステリー・サスペンス', label: 'Horror/Mystery', type: 'tag' },
  { id: 'sf', name: 'ロボット・SF', label: 'Sci-Fi', type: 'tag' },
  { id: 'yuri', name: '百合', label: 'Yuri', type: 'tag' },
  { id: 'bl', name: 'BL', label: 'BL', type: 'tag' },
  { id: 'gourmet', name: 'グルメ', label: 'Gourmet', type: 'tag' },
  { id: 'slice_of_life', name: '日常系', label: 'Slice of life', type: 'tag' },
])
