/**
 * EdgeOne Edge Function：PDF 同源代理
 * 路由：/pdf-proxy/* → huanbao.bj.bcebos.com
 */
const PDF_ORIGIN = 'https://huanbao.bj.bcebos.com'

async function proxyRequest(request) {
  const incoming = new URL(request.url)
  const path = incoming.pathname.replace(/^\/pdf-proxy/, '') || '/'
  const target = `${PDF_ORIGIN}${path}${incoming.search}`

  const upstream = await fetch(target, {
    method: request.method,
    headers: request.headers,
    redirect: 'follow',
  })

  const headers = new Headers(upstream.headers)
  /** BOS 有时返回 octet-stream，pdf.js 需要 application/pdf */
  if (!headers.get('content-type')?.includes('pdf')) {
    headers.set('content-type', 'application/pdf')
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}

export default function onRequest(context) {
  return proxyRequest(context.request)
}
