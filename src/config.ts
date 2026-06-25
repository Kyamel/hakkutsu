const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

export const comicWalker = {
  base: 'https://comic-walker.com',
  headers: {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': BROWSER_UA,
    referer: 'https://comic-walker.com/search/genre',
  },
  // Sort keys accepted by the genreOrTag endpoint.
  sorts: ['new', 'popularity'] as const,
  // Default sort for the new-series feed (most recently updated).
  newSort: 'updateWithCutoff',
}

export const mangaDex = {
  base: 'https://api.mangadex.org',
  site: 'https://mangadex.org',
  headers: {
    accept: 'application/json',
    'user-agent': 'hakkutsu/0.1 (manga discovery tool)',
  },
}

// Minimum title similarity (0..1) to treat a MangaDex hit as a real match.
export const matchThreshold = 0.45

// Curated genres/tags from comic-walker's genre page. IDs are stable; the
// site exposes no public listing endpoint, so we ship a known-good set.
export interface Tag {
  id: string
  name: string // Japanese label as shown on comic-walker
  label: string // English hint for the UI
  type: 'genre' | 'tag'
}

export const tags: Tag[] = [
  { id: '018a262f-986a-7cca-8c8e-4c8d4b229a94', name: 'ファンタジー', label: 'Fantasy', type: 'genre' },
  { id: '018a262f-9865-788e-9694-4758845b6e7d', name: '恋愛', label: 'Romance', type: 'genre' },
  { id: '018a262f-9867-732e-9f85-4de36099ba03', name: 'ギャグ・コメディ', label: 'Comedy', type: 'genre' },
  { id: '018a262f-9861-7f53-b3d7-773cfc841581', name: 'ホラー', label: 'Horror', type: 'genre' },
  { id: '018a262f-985e-7472-957c-58e0f4cd9d23', name: '青春・学園', label: 'School', type: 'genre' },
  { id: '018a262f-9860-7033-b06d-961a9b224c75', name: 'バトル・アクション', label: 'Action', type: 'genre' },
  { id: '018a262f-9868-77dc-a3bf-c114e2fc15eb', name: 'ミステリー・サスペンス', label: 'Mystery', type: 'genre' },
  { id: '018a262f-9863-7550-bd8b-dc4da2683a29', name: 'ロボット・SF', label: 'Sci-Fi', type: 'genre' },
  { id: '018a262f-9864-7052-8580-357cee6e037e', name: '歴史', label: 'History', type: 'genre' },
  { id: '018a262f-985f-77b9-9fa8-a2c93468d07d', name: 'お仕事', label: 'Work life', type: 'genre' },
  { id: '018a262f-9866-7c85-bb4d-dca80b1ba47d', name: '動物', label: 'Animals', type: 'genre' },
  { id: '018a178c-a906-7b25-bb70-4cba748efdfa', name: '少年', label: 'Shounen', type: 'genre' },
  { id: '018a178c-a908-71de-89b0-6edf2fe71a8e', name: '少女', label: 'Shoujo', type: 'genre' },
  { id: '018a178c-a907-74f2-9038-a98bd8bbf2db', name: '青年', label: 'Seinen', type: 'genre' },
  { id: '018a178c-a909-7ad4-8d88-e4f324c36061', name: '女性', label: 'Josei', type: 'genre' },
  { id: '018a178c-a90a-77f4-9721-a60dcd60edab', name: 'BL', label: 'BL', type: 'genre' },
  { id: '018a178c-a90b-7b54-9bd1-90285f8e4e42', name: 'TL', label: 'TL', type: 'genre' },
  { id: '018b8a02-f3dc-7095-a085-45594e3008b7', name: '異世界', label: 'Isekai', type: 'tag' },
  { id: '018b8a02-f34b-7623-b290-b01ff400d7ef', name: '転生', label: 'Reincarnation', type: 'tag' },
  { id: '018b8a02-f414-7e66-9fae-90edeed872cd', name: '悪役令嬢', label: 'Villainess', type: 'tag' },
  { id: '018b8a02-f3d7-723e-a60d-8ab63ba5c724', name: 'ラブコメ', label: 'Romcom', type: 'tag' },
  { id: '018b8a02-f343-7d79-bb0b-098d9b7419ca', name: 'ハーレム', label: 'Harem', type: 'tag' },
  { id: '018b8a02-f3d9-7a59-969d-288cb905f0fc', name: '百合', label: 'Yuri', type: 'tag' },
  { id: '018b8a02-f3de-72fc-930a-918afbc84a60', name: 'グルメ', label: 'Gourmet', type: 'tag' },
  { id: '018b8a02-f3d4-7c56-94a2-0560e20e6599', name: '日常系', label: 'Slice of life', type: 'tag' },
  { id: '018b8a02-f3a8-789a-954f-45d882c6ff8e', name: 'コミカライズ', label: 'Comicalization', type: 'tag' },
  { id: '018b8a02-f374-7027-a968-ef92f1346bff', name: '小説家になろう', label: 'Web novel', type: 'tag' },
  { id: '018b8a02-f3d6-7d77-812d-e22733f0b836', name: '料理', label: 'Cooking', type: 'tag' },
  { id: '018b8a02-f3db-70e6-9af7-cce9a1828f10', name: 'コミックエッセイ', label: 'Comic essay', type: 'tag' },
  { id: '018b8a02-f3c1-7357-ae28-49dde62b4b71', name: 'スローライフ', label: 'Slow life', type: 'tag' },
  { id: '018b8a02-f362-736f-93e9-a783e8ad031a', name: 'チート', label: 'Cheat', type: 'tag' },
  { id: '018b8a02-f3c5-7c85-a939-59c0a8683831', name: 'ざまぁ', label: 'Comeuppance', type: 'tag' },
  { id: '018b8a02-f43a-7f6b-a1b0-728dc6b5ff42', name: 'モンスター', label: 'Monsters', type: 'tag' },
  { id: '018b8a02-f3b9-7bdd-99cc-dbb57a32d182', name: '胸キュン', label: 'Heart-throb', type: 'tag' },
  { id: '018b8a02-f45c-7e7a-92b1-8e624007e953', name: '溺愛', label: 'Doting', type: 'tag' },
  { id: '018b8a02-f40a-7cb1-b857-a683f6a27fdf', name: 'ヤンデレ', label: 'Yandere', type: 'tag' },
  { id: '018b8a02-f45f-76fc-a79c-594544a3ea0c', name: 'TS', label: 'Genderswap', type: 'tag' },
  { id: '018b8a02-f45e-7885-8cb4-177d0d98d35d', name: 'オメガバース', label: 'Omegaverse', type: 'tag' },
  { id: '018b8a02-f459-7561-a6de-9a6270d7a919', name: '大人向け', label: 'Mature', type: 'tag' },
  { id: '018b8a02-f464-7a16-9852-46d108d3401c', name: 'お色気', label: 'Ecchi', type: 'tag' },
  { id: '018b8a02-f42d-7380-8a08-5368772d49db', name: 'おっぱい', label: 'Busty', type: 'tag' },
  { id: '018b8a02-f3fc-76a0-b1a0-1ab8e0bf283f', name: '美少女', label: 'Bishoujo', type: 'tag' },
  { id: '018b8a02-f40b-70f6-ace1-57a1ecfe07f8', name: 'ギャル', label: 'Gyaru', type: 'tag' },
  { id: '018b8a02-f3a6-71ab-aafb-2eefc23b63d2', name: 'アニメ化', label: 'Anime adaptation', type: 'tag' },
  { id: '018b8a02-f3a9-78af-a745-1ee68a020cd4', name: 'ラノベ原作', label: 'Light-novel based', type: 'tag' },
  { id: '018b8a02-f37f-7c3b-a0b9-56dd478ef5b2', name: 'カドカワBOOKS', label: 'Kadokawa Books', type: 'tag' },
  { id: '018b8a02-f379-7d57-b06e-2402d4e41bae', name: '角川文庫', label: 'Kadokawa Bunko', type: 'tag' },
  { id: '018b8a02-f37d-7448-aa99-299bbe6d1e0c', name: 'カクヨム', label: 'Kakuyomu', type: 'tag' },
  { id: '018b8a02-f3e7-7a97-892b-31d46e344134', name: '東方Project', label: 'Touhou Project', type: 'tag' },
  { id: '018b8a02-f3e3-7c02-bdeb-480bd73fb9e5', name: 'ガンダム', label: 'Gundam', type: 'tag' },
  { id: '018b8a02-f3e5-76e9-9780-42c244b102e3', name: 'Fate', label: 'Fate', type: 'tag' },
]

// A lower-case, URL-friendly handle derived from the English label, e.g.
// "Slice of life" -> "slice-of-life". Used as the `tag` query param.
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface TagInfo extends Tag {
  slug: string
}

export const tagList: TagInfo[] = tags.map((t) => ({ ...t, slug: slugify(t.label) }))

const tagsBySlug = new Map(tagList.map((t) => [t.slug, t]))

export function tagBySlug(slug: string): TagInfo | undefined {
  return tagsBySlug.get(slug.toLowerCase())
}

// The free-campaign feed has its own (smaller) category set, keyed by string
// `type` rather than the genre/tag UUIDs. Labels are ours for the UI.
export interface FreeCategory {
  type: string
  name: string
  label: string
}

export const freeCategories: FreeCategory[] = [
  { type: 'fantasy', name: 'ファンタジー', label: 'Fantasy' },
  { type: 'romance', name: '恋愛', label: 'Romance' },
  { type: 'romcom', name: 'ラブコメ', label: 'Romcom' },
  { type: 'isekai', name: '異世界・転生', label: 'Isekai' },
  { type: 'comedy', name: 'ギャグ・コメディ', label: 'Comedy' },
  { type: 'action', name: 'バトル・アクション', label: 'Action' },
  { type: 'horror', name: 'ホラー・ミステリー・サスペンス', label: 'Horror/Mystery' },
  { type: 'sf', name: 'ロボット・SF', label: 'Sci-Fi' },
  { type: 'yuri', name: '百合', label: 'Yuri' },
  { type: 'bl', name: 'BL', label: 'BL' },
  { type: 'gourmet', name: 'グルメ', label: 'Gourmet' },
  { type: 'slice_of_life', name: '日常系', label: 'Slice of life' },
]

const freeTypes = new Set(freeCategories.map((c) => c.type))

export function isFreeCategory(type: string): boolean {
  return freeTypes.has(type)
}
