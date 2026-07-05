/**
 * 上传 API 专用 Cloud Function（Node.js）
 * 路由：/hb-cloud/api/v1/upload/one → 源站 /hb/api/v1/upload/one
 * 使用 arrayBuffer 转发，避免 stream+duplex 在 EdgeOne 运行时挂起导致 504
 */
const API_ORIGIN = 'https://ai-test.luxiaoban.com'

function toUpstreamUrl(requestUrl) {
  const incoming = new URL(requestUrl)
  const upstreamPath = incoming.pathname.replace(/^\/hb-cloud/, '/hb')
  return `${API_ORIGIN}${upstreamPath}${incoming.search}`
}

async function proxyRequest(request) {
  const target = toUpstreamUrl(request.url)

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

export function onRequest(context) {
  return proxyRequest(context.request)
}

export function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  })
}
