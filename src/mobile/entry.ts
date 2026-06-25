import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { createApp } from '../app.js'

const localApi = createApp({ providerRuntime: 'native' })
const networkFetch = globalThis.fetch.bind(globalThis)

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const request = toAbsoluteRequest(input, init)
  const url = new URL(request.url)

  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    const localUrl = `https://hakkutsu.local${url.pathname}${url.search}`
    return localApi.fetch(new Request(localUrl, request))
  }

  if (Capacitor.isNativePlatform() && (url.protocol === 'https:' || url.protocol === 'http:')) {
    return nativeHttpFetch(request)
  }

  return networkFetch(input, init)
}

loadSharedClient()

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

async function nativeHttpFetch(request: Request): Promise<Response> {
  const headers = Object.fromEntries(request.headers.entries())
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
