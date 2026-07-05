/**
 * EdgeOne Edge Function：将 /hb/api/* 反向代理到 API 源站
 * 路由：edge-functions/hb/api/[[default]].js → /hb/api/v1/...
 */
const API_ORIGIN = 'https://ai-test.luxiaoban.com'

/** 转发请求到源站，保留 method / headers / body */
async function proxyRequest(request) {
  const incoming = new URL(request.url)
  const target = `${API_ORIGIN}${incoming.pathname}${incoming.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('connection')

  /** @type {RequestInit} */
  const init = {
    method: request.method,
    headers,
    redirect: 'follow',
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  const upstream = await fetch(target, init)

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  })
}

/** EdgeOne 文档：default export onRequest 匹配全部 HTTP 方法（含 OPTIONS） */
export default function onRequest(context) {
  return proxyRequest(context.request)
}
