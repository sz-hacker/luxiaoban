/**
 * 大文件上传代理（Serverless 流式转发，规避 Edge Middleware 4MB 限制）
 * 路由：/hb-cloud/* → 源站 /hb/*
 */
const API_ORIGIN = 'https://ai-test.luxiaoban.com'

const ALLOWED_ORIGINS = new Set([
  'https://sz-hacker.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

/** 写入 CORS 响应头 */
function setCors(req, res) {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.has(origin)) {
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

/** 保留除 path 外的查询参数 */
function buildQueryString(query) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (key === 'path') continue
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
    } else if (value != null) {
      params.append(key, value)
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export default async function handler(req, res) {
  setCors(req, res)

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const rawPath = req.query.path
  const pathPart = Array.isArray(rawPath) ? rawPath.join('/') : rawPath || ''
  const targetUrl = `${API_ORIGIN}/hb/${pathPart}${buildQueryString(req.query)}`

  const headers = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue
    const lower = key.toLowerCase()
    if (lower === 'host' || lower === 'connection' || lower === 'content-length') continue
    headers[key] = Array.isArray(value) ? value.join(', ') : value
  }

  /** @type {RequestInit & { duplex?: 'half' }} */
  const init = {
    method: req.method,
    headers,
    redirect: 'follow',
  }

  // 流式转发 multipart，避免在函数内缓冲整个文件
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req
    init.duplex = 'half'
  }

  const upstream = await fetch(targetUrl, init)
  res.statusCode = upstream.status
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'access-control-allow-origin') return
    res.setHeader(key, value)
  })

  const body = Buffer.from(await upstream.arrayBuffer())
  res.end(body)
}

export const config = {
  api: {
    bodyParser: false,
  },
}
