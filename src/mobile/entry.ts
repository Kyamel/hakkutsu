import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { createApp } from '../app.js'

const localApi = createApp({ providerRuntime: 'native' })
const networkFetch = globalThis.fetch.bind(globalThis)

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = toAbsoluteUrl(input)

  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    const request = toAbsoluteRequest(input, init)
    const localUrl = `https://hakkutsu.local${url.pathname}${url.search}`
    return localApi.fetch(new Request(localUrl, request))
  }

  if (Capacitor.isNativePlatform() && (url.protocol === 'https:' || url.protocol === 'http:')) {
    return nativeHttpFetch(input, init)
  }

  return networkFetch(input, init)
}

loadSharedClient()

function toAbsoluteUrl(input: RequestInfo | URL): URL {
  if (input instanceof Request) return new URL(input.url)
  return new URL(String(input), globalThis.location.href)
}

function toAbsoluteRequest(input: RequestInfo | URL, init?: RequestInit): Request {
  if (input instanceof Request) return init ? new Request(input, init) : input
  return new Request(new URL(String(input), globalThis.location.href), init)
}

function loadSharedClient(): void {
  const script = document.createElement('script')
  script.src = '/app.js'
  script.async = false
  document.body.appendChild(script)
}

async function nativeHttpFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = toAbsoluteRequest(input, init)
  const headers = nativeHeaders(input, init, request.headers)
  const method = request.method.toUpperCase()
  const data = method === 'GET' || method === 'HEAD' ? undefined : await request.text()
  const response = await CapacitorHttp.request({
    url: request.url,
    method,
    headers,
    data,
    responseType: 'text',
    connectTimeout: 15000,
    readTimeout: 15000,
  })

  return new Response(normalizeNativeBody(response.data), {
    status: response.status,
    headers: response.headers,
  })
}

function normalizeNativeBody(data: unknown): BodyInit | null {
  if (data == null) return null
  if (typeof data === 'string') return data
  return JSON.stringify(data)
}

function nativeHeaders(input: RequestInfo | URL, init: RequestInit | undefined, fallback: Headers): Record<string, string> {
  const headers = new Headers(fallback)
  if (input instanceof Request) appendHeaders(headers, input.headers)
  appendHeaders(headers, init?.headers)

  const userAgent = headers.get('user-agent') ?? headers.get('User-Agent')
  if (userAgent) {
    headers.delete('user-agent')
    headers.delete('User-Agent')
    headers.set('x-cap-user-agent', userAgent)
  }

  return Object.fromEntries(headers.entries())
}

function appendHeaders(target: Headers, source: HeadersInit | undefined): void {
  if (!source) return
  new Headers(source).forEach((value, key) => {
    target.set(key, value)
  })
}
