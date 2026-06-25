// Normalize a title for fuzzy comparison: unify full/half-width via NFKC,
// lowercase, and drop whitespace, punctuation and symbols.
export function normalizeTitle(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '')
}

// Japanese light-novel titles are a short main title plus a long subtitle.
// MangaDex's search does poorly on the full string, so query with the head
// (text before the first separator). The full title is still used for scoring.
export function searchTerm(input: string): string {
  const head = input.split(/[\s　～〜~「『（(：:、，,―—-]/u)[0].trim()
  return head.length >= 2 ? head : input.trim()
}

// Dice coefficient over character bigrams. Returns 1 for identical strings.
export function similarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const bigrams = (s: string) => {
    const map = new Map<string, number>()
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2)
      map.set(g, (map.get(g) ?? 0) + 1)
    }
    return map
  }
  const ma = bigrams(a)
  const mb = bigrams(b)
  let overlap = 0
  for (const [g, count] of ma) {
    overlap += Math.min(count, mb.get(g) ?? 0)
  }
  return (2 * overlap) / (a.length - 1 + (b.length - 1))
}
