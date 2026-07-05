/** 代理健康检查 */
import { setCors } from './_shared.mjs'

export default function handler(req, res) {
  setCors(req, res)
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ ok: true, service: 'luxiaoban-proxy' }))
}
