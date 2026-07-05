/**
 * 上传代理：/hb-cloud/* → 源站 /hb/*（与 EdgeOne Cloud Function 路径一致）
 */
import { forwardRequest, pathFromQuery, buildQueryString } from '../_lib/cors.mjs'

const API_ORIGIN = 'https://ai-test.luxiaoban.com'

export default async function handler(req, res) {
  const pathPart = pathFromQuery(req.query)
  const targetUrl = `${API_ORIGIN}/hb/${pathPart}${buildQueryString(req.query)}`
  await forwardRequest(req, res, targetUrl)
}

export const config = {
  api: {
    bodyParser: false,
  },
}
