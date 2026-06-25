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
