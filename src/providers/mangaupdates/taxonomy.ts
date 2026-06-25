import { defineTaxonomy } from '../taxonomy.js'

// MangaUpdates' search uses the genre/type NAMES as the filter values, so each
// taxonomy item id is the name itself. Names are already English, so name and
// label match. The 36 genres come from GET /v1/genres.
const GENRES = [
  'Action',
  'Adult',
  'Adventure',
  'Comedy',
  'Doujinshi',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Gender Bender',
  'Harem',
  'Hentai',
  'Historical',
  'Horror',
  'Josei',
  'Lolicon',
  'Martial Arts',
  'Mature',
  'Mecha',
  'Mystery',
  'Psychological',
  'Romance',
  'School Life',
  'Sci-fi',
  'Seinen',
  'Shotacon',
  'Shoujo',
  'Shoujo Ai',
  'Shounen',
  'Shounen Ai',
  'Slice of Life',
  'Smut',
  'Sports',
  'Supernatural',
  'Tragedy',
  'Yaoi',
  'Yuri',
]

export const mangaUpdatesGenres = defineTaxonomy(
  GENRES.map((genre) => ({ id: genre, name: genre, label: genre })),
)

// Content formats. id = MU type name used by the search `type` filter.
const TYPES = ['Manga', 'Manhwa', 'Manhua', 'Novel', 'Doujinshi', 'OEL', 'Artbook']

export const mangaUpdatesTypes = defineTaxonomy(
  TYPES.map((type) => ({ id: type, name: type, label: type })),
)
