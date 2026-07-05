/**
 * Edge Middleware：在 Serverless Function 之前处理 CORS 预检
 * 解决 /hb/* 路由 OPTIONS 无 Access-Control-Allow-Origin 的问题
 */
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

export default function middleware(request) {
  if (request.method !== 'OPTIONS') {
    return
  }
  return new Response(null, { status: 204, headers: buildCorsHeaders(request) })
}

export const config = {
  matcher: ['/hb/:path*', '/hb-cloud/:path*', '/pdf-proxy/:path*'],
}
