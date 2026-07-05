/**
 * 大文件上传 CORS 代理（Cloudflare Workers）
 * 规避 Vercel Serverless 4.5MB 请求体硬限制（本 Worker 支持更大 multipart 上传）
 * 路由：/hb-cloud/* → 源站 /hb/*
 */
const API_ORIGIN = 'https://ai-test.luxiaoban.com'

/** 允许跨域访问的前端来源 */
const ALLOWED_ORIGINS = new Set([
  'https://sz-hacker.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

/** 根据请求来源生成 CORS 响应头 */
function buildCorsHeaders(request) {
  const origin = request.headers.get('Origin') ?? ''
  const headers = new Headers()
  if (ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
  }
  headers.set('Vary', 'Origin')
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD')
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control',
  )
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Max-Age', '86400')
  return headers
}

/** 将 /hb-cloud/... 映射为源站 /hb/... */
function buildUpstreamUrl(pathname, search) {
  const upstreamPath = pathname.replace(/^\/hb-cloud/, '/hb')
  return `${API_ORIGIN}${upstreamPath}${search}`
}

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const cors = buildCorsHeaders(request)

    if (url.pathname === '/_upload-health') {
      cors.set('Content-Type', 'application/json; charset=utf-8')
      return new Response(JSON.stringify({ ok: true, service: 'luxiaoban-upload-proxy' }), {
        status: 200,
        headers: cors,
      })
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    if (!url.pathname.startsWith('/hb-cloud/')) {
      return new Response('Not Found', { status: 404, headers: cors })
    }

    const target = buildUpstreamUrl(url.pathname, url.search)
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
  },
}
