import { comicWalkerProvider } from './comicwalker.js'
import type { MangaProvider, ProviderSummary } from './types.js'

const providers = [comicWalkerProvider] as const
const providersById = new Map<string, MangaProvider>(providers.map((provider) => [provider.summary.id, provider]))

export const defaultProvider = comicWalkerProvider

export function listProviders(): ProviderSummary[] {
  return providers.map((provider) => provider.summary)
}

export function getProvider(id: string | undefined): MangaProvider | undefined {
  if (!id) return defaultProvider
  return providersById.get(id)
}
