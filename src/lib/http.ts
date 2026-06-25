import type { ContentfulStatusCode } from 'hono/utils/http-status'

export class HttpError extends Error {
  constructor(public status: ContentfulStatusCode, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  return fetchWith(url, init, timeoutMs, (res) => res.json() as Promise<T>)
}

// Same retry/timeout behaviour as fetchJson, but yields the raw response body as
// text — for providers whose upstream serves XML or HTML rather than JSON.
export function fetchText(url: string, init: RequestInit = {}, timeoutMs = 15000): Promise<string> {
  return fetchWith(url, init, timeoutMs, (res) => res.text())
}

async function fetchWith<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  parse: (res: Response) => Promise<T>,
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
        lastError = `${init.method ?? 'GET'} ${url} -> ${res.status}${await errorContext(res)}`
        if (attempt < maxAttempts && shouldRetry(res.status)) {
          await delay(retryDelayMs(res, attempt))
          continue
        }
        throw new HttpError(502, lastError)
      }

      return await parse(res)
    } finally {
      clearTimeout(timer)
    }
  }

  throw new HttpError(502, lastError ?? `${init.method ?? 'GET'} ${url} failed`)
}

async function errorContext(res: Response): Promise<string> {
  const details = [
    res.headers.get('x-hakkutsu-native-fetch') ? `native=${res.headers.get('x-hakkutsu-native-fetch')}` : null,
    res.headers.get('x-hakkutsu-native-request') ? `request=${res.headers.get('x-hakkutsu-native-request')}` : null,
    res.headers.get('content-type') ? `content-type=${res.headers.get('content-type')}` : null,
  ].filter(Boolean)

  const body = await res.clone().text().catch(() => '')
  const preview = body.replace(/\s+/g, ' ').trim().slice(0, 300)
  if (preview) details.push(`body=${preview}`)

  return details.length ? ` (${details.join('; ')})` : ''
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
