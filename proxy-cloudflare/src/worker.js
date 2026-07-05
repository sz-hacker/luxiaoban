/**
 * GitHub Pages 演示用 CORS 反向代理（Cloudflare Workers）
 * 统一代理 API、大文件上传、PDF 预览，替代 Vercel 代理
 */
const API_ORIGIN = 'https://ai-test.luxiaoban.com'
const PDF_ORIGIN = 'https://huanbao.bj.bcebos.com'

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
    request.headers.get('Access-Control-Request-Headers') ??
      'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control',
  )
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Max-Age', '86400')
  return headers
}

/**
 * 根据路径拼上游 URL
 * @param {string} pathname 请求路径
 * @param {string} search 查询字符串
 * @returns {string|null} 上游地址，无法识别时返回 null
 */
function buildUpstreamUrl(pathname, search) {
  if (pathname.startsWith('/hb/')) {
    return `${API_ORIGIN}${pathname}${search}`
  }
  if (pathname.startsWith('/hb-cloud/')) {
    const upstreamPath = pathname.replace(/^\/hb-cloud/, '/hb')
    return `${API_ORIGIN}${upstreamPath}${search}`
  }
  if (pathname.startsWith('/pdf-proxy/')) {
    return `${PDF_ORIGIN}/${pathname.slice('/pdf-proxy/'.length)}${search}`
  }
  return null
}

export default {
  async fetch(request) {
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
      return new Response('Not Found', { status: 404, headers: cors })
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
  },
}
