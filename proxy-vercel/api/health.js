/** 代理健康检查 */
import { setCors } from '../_lib/cors.mjs'

export default function handler(req, res) {
  setCors(req, res)
  res.status(200).json({ ok: true, service: 'luxiaoban-proxy' })
}
