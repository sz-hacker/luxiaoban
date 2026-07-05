/**
 * 上传代理：/hb-cloud/* → 源站 /hb/*
 */
import { forwardRequest, buildQueryString, resolveProxyPath } from '../../lib/cors.mjs'

const API_ORIGIN = 'https://ai-test.luxiaoban.com'

export default async function handler(req, res) {
  const pathPart = resolveProxyPath(req, 'hb-cloud')
  const targetUrl = `${API_ORIGIN}/hb/${pathPart}${buildQueryString(req.query)}`
  await forwardRequest(req, res, targetUrl)
}

export const config = {
  api: {
    bodyParser: false,
  },
}
