/**
 * 上传请求 URL 与预览 token 工具
 * 生产环境经 Cloud Function /hb-cloud 转发，规避 Edge Function 1MB 限制
 */
const API_BASE = import.meta.env.VITE_API_BASE || '/hb/api/v1'

/** Cloud Function 上传代理前缀（对应 cloud-functions/hb-cloud/...） */
const UPLOAD_PROXY_PREFIX = import.meta.env.VITE_UPLOAD_PROXY || '/hb-cloud/api/v1'

/** 单文件上传地址（XHR FormData） */
export function getUploadOneUrl(): string {
  const base = UPLOAD_PROXY_PREFIX.replace(/\/$/, '')
  return appendPreviewQuery(`${base}/upload/one`)
}

/** 是否为绝对 URL（GitHub Pages 演示环境直连源站 API 时使用） */
function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

/** 格式化请求 URL：同源用路径，跨域保留完整地址 */
function formatRequestUrl(resolved: URL): string {
  if (typeof window === 'undefined') return resolved.href
  if (isAbsoluteUrl(resolved.href) && resolved.origin !== window.location.origin) {
    return resolved.href
  }
  return `${resolved.pathname}${resolved.search}`
}

/** EdgeOne 预览域名需附带 eo_token */
function appendPreviewQuery(url: string): string {
  if (typeof window === 'undefined') return url

  const page = new URL(window.location.href)
  const eoToken = page.searchParams.get('eo_token')
  const eoTime = page.searchParams.get('eo_time')
  const resolved = new URL(url, window.location.origin)
  if (!eoToken || !eoTime) return formatRequestUrl(resolved)

  resolved.searchParams.set('eo_token', eoToken)
  resolved.searchParams.set('eo_time', eoTime)
  return formatRequestUrl(resolved)
}

export { API_BASE }
