import type { BrowseGroup, SortOption, TaxonomyItem } from './types.js'

export type TaxonomySeed = Omit<TaxonomyItem, 'slug'>

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Attach a URL-safe slug (derived from the label) to each taxonomy item.
export function defineTaxonomy(items: TaxonomySeed[]): TaxonomyItem[] {
  return items.map((item) => ({ ...item, slug: slugify(item.label) }))
}

// A dimension whose items you navigate into (genres, tags). Pass `multiSelect`/
// `supportsExclude` for advanced providers that accept several genres at once or
// can negate them.
export function browseGroup(
  key: 'genres' | 'tags',
  label: string,
  items: TaxonomyItem[],
  sorts: SortOption[],
  options: { multiSelect?: boolean; supportsExclude?: boolean } = {},
): BrowseGroup {
  const param = key === 'genres' ? 'genreId' : 'tagId'
  return { key, label, mode: 'browse', param, items, sorts, ...options }
}

// A content-format dimension (e.g. Manga / Manhwa / Novel). Pass `multiSelect`
// for providers that accept several formats at once.
export function typesGroup(
  label: string,
  items: TaxonomyItem[],
  sorts: SortOption[],
  options: { multiSelect?: boolean } = {},
): BrowseGroup {
  return { key: 'types', label, mode: 'browse', param: 'type', items, sorts, ...options }
}

// A toggleable feed; pass items + param when the feed accepts a secondary filter.
export function feedGroup(
  key: 'new',
  label: string,
  options: { items?: TaxonomyItem[]; param?: 'genreId' | 'tagId'; sorts?: SortOption[] } = {},
): BrowseGroup {
  return {
    key,
    label,
    mode: 'feed',
    param: options.param,
    items: options.items ?? [],
    sorts: options.sorts ?? [],
  }
}
