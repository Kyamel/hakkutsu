import { comicWalkerProvider } from './comicwalker/index.js'
import { comicWalkerFreeProvider } from './comicwalker-free/index.js'
import type { MangaProvider, ProviderSummary } from './types.js'

// Registry: the single shared touch-point. To add a provider, create its folder
// and append it here — no other file outside the provider folder changes.
const providers: MangaProvider[] = [comicWalkerProvider, comicWalkerFreeProvider]
const providersById = new Map<string, MangaProvider>(providers.map((provider) => [provider.summary.id, provider]))

export const defaultProvider = providers[0]

export function listProviders(): ProviderSummary[] {
  return providers.map((provider) => provider.summary)
}

export function getProvider(id: string | undefined): MangaProvider | undefined {
  if (!id) return defaultProvider
  return providersById.get(id)
}

export function findTaxonomyItem(provider: MangaProvider, slug: string | undefined, type?: 'genre' | 'tag') {
  if (!slug) return undefined
  const items = type
    ? provider.taxonomy[type === 'genre' ? 'genres' : 'tags']
    : [...provider.taxonomy.genres, ...provider.taxonomy.tags]
  return items.find((item) => item.slug.toLowerCase() === slug.toLowerCase())
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
