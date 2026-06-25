import { comicWalkerProvider } from './comicwalker/index.js'
import { comicWalkerFreeProvider } from './comicwalker-free/index.js'
import { mangaUpdatesProvider } from './mangaupdates/index.js'
import { nicoProvider } from './nico/index.js'
import { pixivComicProvider } from './pixiv-comic/index.js'
import type { MangaProvider, ProviderSummary } from './types.js'

// Registry: the single shared touch-point. To add a provider, create its folder
// and append it here — no other file outside the provider folder changes.
const providers: MangaProvider[] = [
  comicWalkerProvider,
  comicWalkerFreeProvider,
  pixivComicProvider,
  nicoProvider,
  //mangaUpdatesProvider,
]
const providersById = new Map<string, MangaProvider>(providers.map((provider) => [provider.summary.id, provider]))

export const defaultProvider = providers[0]

export function listProviders(): ProviderSummary[] {
  return providers.map((provider) => provider.summary)
}

export function getProvider(id: string | undefined): MangaProvider | undefined {
  if (!id) return defaultProvider
  return providersById.get(id)
}

// Resolve a slug to its taxonomy item, optionally restricted to one dimension.
export function findTaxonomyItem(
  provider: MangaProvider,
  slug: string | undefined,
  key?: 'genres' | 'tags' | 'types',
) {
  if (!slug) return undefined
  const groups = key
    ? provider.taxonomy.groups.filter((group) => group.key === key)
    : provider.taxonomy.groups
  const target = slug.toLowerCase()
  for (const group of groups) {
    const match = group.items.find((item) => item.slug.toLowerCase() === target)
    if (match) return match
  }
  return undefined
}

// Resolve a comma-separated list of slugs to their taxonomy item ids (unknown
// slugs are dropped). Used for multi-select genre filters.
export function findTaxonomyItems(
  provider: MangaProvider,
  csv: string | undefined,
  key?: 'genres' | 'tags' | 'types',
): string[] {
  if (!csv) return []
  return csv
    .split(',')
    .map((slug) => findTaxonomyItem(provider, slug.trim(), key)?.id)
    .filter((id): id is string => Boolean(id))
}

export function providerCacheTtl(pathname: string, providerId: string | undefined): number | null {
  if (pathname === '/api/providers' || pathname === '/api/openapi.json') return 86400
  if (pathname === '/api/taxonomy') {
    return getProvider(providerId)?.summary.ttl.metadata ?? null
  }
  if (pathname === '/api/works') {
    return getProvider(providerId)?.summary.ttl.search ?? null
  }
  if (pathname === '/api/match') return 21600
  return null
}
