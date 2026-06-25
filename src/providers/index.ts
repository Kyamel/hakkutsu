import { comicWalkerProvider } from './comicwalker/index.js'
import { comicWalkerFreeProvider } from './comicwalker-free/index.js'
import { mangaUpdatesProvider } from './mangaupdates/index.js'
import { nicoProvider } from './nico/index.js'
import { pixivComicProvider } from './pixiv-comic/index.js'
import type { MangaProvider, ProviderSummary } from './types.js'

export type ProviderRuntime = 'worker' | 'native'

// Registry: the single shared touch-point. To add a provider, create its folder
// and append it here — no other file outside the provider folder changes.
const workerProviders: MangaProvider[] = [
  comicWalkerProvider,
  comicWalkerFreeProvider,
  nicoProvider,
  //mangaUpdatesProvider,
  // pixiv-comic is implemented but intentionally not registered: Pixiv's API
  // returns 403 to Cloudflare Workers egress even with browser-like headers.
]

const nativeProviders: MangaProvider[] = [
  comicWalkerProvider,
  comicWalkerFreeProvider,
  pixivComicProvider,
  nicoProvider,
  //mangaUpdatesProvider,
]

export const defaultProvider = workerProviders[0]

export function listProviders(runtime: ProviderRuntime = 'worker'): ProviderSummary[] {
  return providersFor(runtime).map((provider) => provider.summary)
}

export function getProvider(id: string | undefined, runtime: ProviderRuntime = 'worker'): MangaProvider | undefined {
  const providers = providersFor(runtime)
  if (!id) return defaultProvider
  return new Map<string, MangaProvider>(providers.map((provider) => [provider.summary.id, provider])).get(id)
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

export function providerCacheTtl(
  pathname: string,
  providerId: string | undefined,
  runtime: ProviderRuntime = 'worker',
): number | null {
  if (pathname === '/api/providers' || pathname === '/api/openapi.json') return 86400
  if (pathname === '/api/taxonomy') {
    return getProvider(providerId, runtime)?.summary.ttl.metadata ?? null
  }
  if (pathname === '/api/works') {
    return getProvider(providerId, runtime)?.summary.ttl.search ?? null
  }
  if (pathname === '/api/match') return 21600
  return null
}

function providersFor(runtime: ProviderRuntime): MangaProvider[] {
  return runtime === 'native' ? nativeProviders : workerProviders
}
