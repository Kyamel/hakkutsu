import { defineTaxonomy } from '../taxonomy.js'

// Ranking categories, keyed by the slug the ranking URL expects
// (/ranking/{point|view}/{span}/{category}). The leading "all" item aggregates
// every category and is used as the fallback when no genre is selected.
export const nicoCategories = defineTaxonomy([
  { id: 'all', name: '総合', label: 'All' },
  { id: 'shonen', name: '少年マンガ', label: 'Shōnen' },
  { id: 'seinen', name: '青年マンガ', label: 'Seinen' },
  { id: 'shojo', name: '少女マンガ', label: 'Shōjo' },
  { id: 'josei', name: '女性マンガ', label: 'Josei' },
  { id: 'yonkoma', name: '4コママンガ', label: '4-koma' },
  { id: 'fan', name: 'ファンコミック', label: 'Fan comics' },
  { id: 'other', name: 'その他', label: 'Other' },
])
