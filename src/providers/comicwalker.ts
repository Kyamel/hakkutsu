import { comicWalker, freeCategories, isFreeCategory, tagBySlug, tagList } from '../config.js'
import { listFree, listNew, searchByTag } from '../services/comicwalker.js'
import type { MangaProvider } from './types.js'

export const comicWalkerProvider: MangaProvider = {
  summary: {
    id: 'comicwalker',
    name: 'ComicWalker',
    site: comicWalker.base,
    capabilities: {
      genres: true,
      tags: true,
      free: true,
      new: true,
      popularitySort: true,
    },
  },
  sorts: comicWalker.sorts,
  newSort: comicWalker.newSort,
  tags: () => tagList,
  tagBySlug,
  freeCategories: () => freeCategories,
  isFreeCategory,
  searchWorks: searchByTag,
  listNew,
  listFree,
}
