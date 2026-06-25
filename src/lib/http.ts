import type { ContentfulStatusCode } from 'hono/utils/http-status'

export class HttpError extends Error {
  constructor(public status: ContentfulStatusCode, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15000,
): Promise<T> {
  const maxAttempts = 3
  let lastError: string | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      let res: Response
      try {
        res = await fetch(url, { ...init, signal: controller.signal })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        lastError = `${init.method ?? 'GET'} ${url} failed: ${message}`
        if (attempt < maxAttempts) {
          await delay(backoffMs(attempt))
          continue
        }
        throw new HttpError(502, lastError)
      }

      if (!res.ok) {
        lastError = `${init.method ?? 'GET'} ${url} -> ${res.status}`
        if (attempt < maxAttempts && shouldRetry(res.status)) {
          await delay(retryDelayMs(res, attempt))
          continue
        }
        throw new HttpError(502, lastError)
      }

      return (await res.json()) as T
    } finally {
      clearTimeout(timer)
    }
  }

  throw new HttpError(502, lastError ?? `${init.method ?? 'GET'} ${url} failed`)
}

function shouldRetry(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504
}

function retryDelayMs(res: Response, attempt: number): number {
  const retryAfter = Number(res.headers.get('retry-after'))
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, 2000)
  }
  return backoffMs(attempt)
}

function backoffMs(attempt: number): number {
  return 250 * 2 ** (attempt - 1)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
