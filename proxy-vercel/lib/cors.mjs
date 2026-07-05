/**
 * CORS 与反向代理工具（放在 api/ 外，避免被 Vercel 当成 Serverless Function）
 */
import { buffer } from 'node:stream/consumers'

const ALLOWED_ORIGINS = [
  'https://sz-hacker.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

/** 写入 Access-Control 响应头 */
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

/** 处理浏览器预检 OPTIONS 请求 */
export function handleOptions(req, res) {
  setCors(req, res)
  res.statusCode = 204
  res.end()
}

/**
 * 转发请求到上游并回写响应（含 CORS）
 * 使用原生 Node http 响应 API，兼容 Vercel Serverless
 */
export async function forwardRequest(req, res, targetUrl) {
  setCors(req, res)
  if (req.method === 'OPTIONS') {
    handleOptions(req, res)
    return
  }

  /** @type {Record<string, string>} */
  const headers = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue
    const lower = key.toLowerCase()
    if (lower === 'host' || lower === 'connection' || lower === 'content-length') continue
    headers[key] = Array.isArray(value) ? value.join(', ') : value
  }

  /** @type {RequestInit} */
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
    const lower = key.toLowerCase()
    if (lower === 'access-control-allow-origin') return
    res.setHeader(key, value)
  })

  const body = Buffer.from(await upstream.arrayBuffer())
  res.end(body)
}

/** 将 query.path 转为路径字符串 */
export function pathFromQuery(query) {
  const raw = query.path
  if (Array.isArray(raw)) return raw.join('/')
  return raw || ''
}

/** 保留除内部参数外的查询参数 */
export function buildQueryString(query, exclude = ['path', 'prefix']) {
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
