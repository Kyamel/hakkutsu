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
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    let res: Response
    try {
      res = await fetch(url, { ...init, signal: controller.signal })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new HttpError(502, `${init.method ?? 'GET'} ${url} failed: ${message}`)
    }

    if (!res.ok) {
      throw new HttpError(502, `${init.method ?? 'GET'} ${url} -> ${res.status}`)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}
