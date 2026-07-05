/**
 * Edge Middleware：统一处理 CORS + 反向代理
 * 避免 Vercel Serverless 嵌套动态路由 404 问题
 */
const API_ORIGIN = 'https://ai-test.luxiaoban.com'
const PDF_ORIGIN = 'https://huanbao.bj.bcebos.com'

const ALLOWED_ORIGINS = new Set([
  'https://sz-hacker.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

/** 构建 CORS 响应头 */
function buildCorsHeaders(request) {
  const origin = request.headers.get('origin') ?? ''
  const headers = new Headers()
  if (ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
  }
  headers.set('Vary', 'Origin')
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD')
  headers.set(
    'Access-Control-Allow-Headers',
    request.headers.get('access-control-request-headers') ??
      'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control',
  )
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Max-Age', '86400')
  return headers
}

/** 根据请求路径拼上游 URL */
function buildUpstreamUrl(pathname, search) {
  if (pathname.startsWith('/hb-cloud/')) {
    return `${API_ORIGIN}/hb/${pathname.slice('/hb-cloud/'.length)}${search}`
  }
  if (pathname.startsWith('/hb/')) {
    return `${API_ORIGIN}${pathname}${search}`
  }
  if (pathname.startsWith('/pdf-proxy/')) {
    return `${PDF_ORIGIN}/${pathname.slice('/pdf-proxy/'.length)}${search}`
  }
  return null
}

export default async function middleware(request) {
  const url = new URL(request.url)
  const cors = buildCorsHeaders(request)

  if (url.pathname === '/_proxy-health') {
    cors.set('Content-Type', 'application/json; charset=utf-8')
    return new Response(JSON.stringify({ ok: true, service: 'luxiaoban-proxy' }), {
      status: 200,
      headers: cors,
    })
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  const target = buildUpstreamUrl(url.pathname, url.search)
  if (!target) {
    return
  }

  const headers = new Headers(request.headers)
  headers.delete('host')

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: 'follow',
  })

  const responseHeaders = new Headers(upstream.headers)
  cors.forEach((value, key) => responseHeaders.set(key, value))

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export const config = {
  matcher: ['/_proxy-health', '/hb/:path*', '/hb-cloud/:path*', '/pdf-proxy/:path*'],
}
