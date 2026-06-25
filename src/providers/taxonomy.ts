import type { TaxonomyItem } from './types.js'

export type TaxonomySeed = Omit<TaxonomyItem, 'slug'>

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function defineTaxonomy(items: TaxonomySeed[]): TaxonomyItem[] {
  return items.map((item) => ({ ...item, slug: slugify(item.label) }))
}
