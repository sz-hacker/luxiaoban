/**
 * PDF 代理：/pdf-proxy/* → 百度云 BOS
 */
import { forwardRequest, buildQueryString, resolveProxyPath } from '../../lib/cors.mjs'

const PDF_ORIGIN = 'https://huanbao.bj.bcebos.com'

export default async function handler(req, res) {
  const pathPart = resolveProxyPath(req, 'pdf-proxy')
  const targetUrl = `${PDF_ORIGIN}/${pathPart}${buildQueryString(req.query)}`
  await forwardRequest(req, res, targetUrl)
}

export const config = {
  api: {
    bodyParser: false,
  },
}
