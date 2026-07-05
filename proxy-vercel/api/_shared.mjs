/**
 * 共享 CORS 与反向代理逻辑（放在 api/ 内供 Vercel 打包）
 */
import { buffer } from 'node:stream/consumers'

const ALLOWED_ORIGINS = [
  'https://sz-hacker.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

export function setCors(req, res) {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control',
  )
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')
}

export function handleOptions(req, res) {
  setCors(req, res)
  res.statusCode = 204
  res.end()
}

export async function forwardRequest(req, res, targetUrl) {
  setCors(req, res)
  if (req.method === 'OPTIONS') {
    handleOptions(req, res)
    return
  }

  const headers = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue
    const lower = key.toLowerCase()
    if (lower === 'host' || lower === 'connection' || lower === 'content-length') continue
    headers[key] = Array.isArray(value) ? value.join(', ') : value
  }

  const init = {
    method: req.method,
    headers,
    redirect: 'follow',
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await buffer(req)
  }

  const upstream = await fetch(targetUrl, init)
  res.statusCode = upstream.status
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'access-control-allow-origin') return
    res.setHeader(key, value)
  })
  res.end(Buffer.from(await upstream.arrayBuffer()))
}

export function buildQueryString(query, exclude = ['slug']) {
  const skip = new Set(exclude)
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (skip.has(key)) continue
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
    } else if (value != null) {
      params.append(key, value)
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}
