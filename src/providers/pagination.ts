import type { Work, WorksPage } from '../types.js'
import type { Pagination } from './types.js'

// Build a WorksPage from an upstream total plus this page's items.
export function toPage(total: number, results: Work[], page: Pagination): WorksPage {
  return {
    total,
    limit: page.limit,
    offset: page.offset,
    hasPrevious: page.offset > 0,
    hasNext: page.offset + page.limit < total,
    results,
  }
}
