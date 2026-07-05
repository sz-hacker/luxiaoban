/**
 * 统一反向代理入口（Vercel 嵌套 [...path].js 路由不可靠，改单文件 + rewrite 传参）
 */
import { forwardRequest, pathFromQuery, buildQueryString, setCors } from '../lib/cors.mjs'

const API_ORIGIN = 'https://ai-test.luxiaoban.com'
const PDF_ORIGIN = 'https://huanbao.bj.bcebos.com'

/** 根据 rewrite 注入的 prefix 拼上游 URL */
function buildTargetUrl(prefix, pathPart, query) {
  const qs = buildQueryString(query, ['prefix', 'path'])
  if (prefix === 'hb' || prefix === 'hb-cloud') {
    return `${API_ORIGIN}/hb/${pathPart}${qs}`
  }
  if (prefix === 'pdf-proxy') {
    return `${PDF_ORIGIN}/${pathPart}${qs}`
  }
  return null
}

export default async function handler(req, res) {
  const prefix = Array.isArray(req.query.prefix) ? req.query.prefix[0] : req.query.prefix
  const pathPart = pathFromQuery(req.query)

  const targetUrl = buildTargetUrl(prefix, pathPart, req.query)
  if (!targetUrl) {
    setCors(req, res)
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Unknown proxy prefix', prefix }))
    return
  }

  await forwardRequest(req, res, targetUrl)
}

export const config = {
  api: {
    bodyParser: false,
  },
}
