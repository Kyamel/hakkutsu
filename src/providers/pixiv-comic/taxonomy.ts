import { defineTaxonomy } from '../taxonomy.js'

// pixiv コミック exposes a flat list of categories (`/api/app/categories`). The
// `id` is the numeric category id used by the recent-updates feed
// (`category_ids=`); the category browse endpoint (`/categories/{name}/works`)
// instead keys on the Japanese name, so the provider keeps an id→name lookup.
export const pixivComicCategories = defineTaxonomy([
  { id: '2', name: '恋愛', label: 'Romance' },
  { id: '5', name: 'ファンタジー', label: 'Fantasy' },
  { id: '7', name: 'アクション', label: 'Action' },
  { id: '9', name: 'ギャグ・コメディ', label: 'Comedy' },
  { id: '6', name: 'ホラー・ミステリー', label: 'Horror/Mystery' },
  { id: '10', name: '日常', label: 'Slice of life' },
  { id: '14', name: 'ヒューマンドラマ', label: 'Drama' },
  { id: '4', name: 'グルメ', label: 'Gourmet' },
  { id: '3', name: '動物', label: 'Animals' },
  { id: '15', name: 'スポーツ', label: 'Sports' },
  { id: '16', name: 'お仕事', label: 'Work life' },
  { id: '8', name: 'エッセイ', label: 'Essay' },
  { id: '11', name: 'BL', label: 'BL' },
  { id: '19', name: 'TL', label: 'TL' },
  { id: '13', name: '百合', label: 'Yuri' },
  { id: '20', name: 'タテヨミ', label: 'Webtoon' },
  { id: '21', name: '読み切り', label: 'One-shot' },
  { id: '17', name: 'コミカライズ', label: 'Comicalization' },
  { id: '18', name: '映像化', label: 'Adapted' },
  { id: '1', name: 'pixivコミック限定', label: 'pixiv Exclusive' },
  { id: '12', name: 'その他', label: 'Other' },
])

// Numeric category id → Japanese name (the `/categories/{name}/works` path key).
export const pixivCategoryNameById = new Map(
  pixivComicCategories.map((item) => [item.id, item.name]),
)
