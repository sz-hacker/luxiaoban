/**
 * 统一 API 入口：/api/hb/*、/api/hb-cloud/*、/api/pdf-proxy/*
 * rewrite 后 slug 示例：['hb','api','v1','auth','login']
 */
import { forwardRequest, buildQueryString, setCors } from './_shared.mjs'

const API_ORIGIN = 'https://ai-test.luxiaoban.com'
const PDF_ORIGIN = 'https://huanbao.bj.bcebos.com'

function buildTargetUrl(slug, query) {
  const segments = Array.isArray(slug) ? slug : slug ? [slug] : []
  if (segments.length === 0) return null

  const prefix = segments[0]
  const pathPart = segments.slice(1).join('/')
  const qs = buildQueryString(query)

  if (prefix === 'hb' || prefix === 'hb-cloud') {
    return `${API_ORIGIN}/hb/${pathPart}${qs}`
  }
  if (prefix === 'pdf-proxy') {
    return `${PDF_ORIGIN}/${pathPart}${qs}`
  }
  return null
}

export default async function handler(req, res) {
  const targetUrl = buildTargetUrl(req.query.slug, req.query)
  if (!targetUrl) {
    setCors(req, res)
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Not found', slug: req.query.slug }))
    return
  }
  await forwardRequest(req, res, targetUrl)
}

export const config = {
  api: {
    bodyParser: false,
  },
}
