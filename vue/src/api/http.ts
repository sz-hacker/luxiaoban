import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import router from '@/router'

/** API 基础路径，开发环境走 Vite 代理 */
const BASE_URL = import.meta.env.VITE_API_BASE || '/hb/api/v1'

/** 创建 Axios 实例 */
const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

/** EdgeOne 预览域名需 eo_token，从当前页 URL 透传到 API 请求 */
function appendPreviewToken(config: InternalAxiosRequestConfig) {
  if (typeof window === 'undefined') return
  const page = new URL(window.location.href)
  const eoToken = page.searchParams.get('eo_token')
  const eoTime = page.searchParams.get('eo_time')
  if (!eoToken || !eoTime) return
  config.params = {
    ...(config.params as Record<string, unknown> | undefined),
    eo_token: eoToken,
    eo_time: eoTime,
  }
}

/** 判断响应是否为 HTML（Edge Function 未生效时会返回 SPA 页面） */
function isHtmlResponse(contentType: string, data: unknown) {
  if (contentType.includes('text/html')) return true
  if (typeof data === 'string' && data.trimStart().startsWith('<!DOCTYPE html')) return true
  return false
}

/** EdgeOne 预览域名 401 拦截页（无 eo_token 或 token 过期） */
function isPreviewAccessDenied(contentType: string, data: unknown, status?: number) {
  if (status !== 401 || !isHtmlResponse(contentType, data)) return false
  const text = typeof data === 'string' ? data : ''
  return text.includes('UNAUTHORIZED') || text.includes('Access Restricted')
}

const PREVIEW_ERROR =
  'EdgeOne 预览链接已过期或无权限，请在控制台点击 Preview 获取新链接，或绑定自定义域名'

const PROXY_ERROR =
  'API 代理未生效：请确认部署包含 edge-functions 目录（不能只上传 dist），或绑定自定义域名后重试'

/** 请求拦截：注入 Bearer Token + 预览 token */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  appendPreviewToken(config)
  return config
})

/** 响应拦截：统一错误处理 */
http.interceptors.response.use(
  (res) => {
    const contentType = String(res.headers?.['content-type'] ?? '')
    if (isHtmlResponse(contentType, res.data)) {
      return Promise.reject(new Error(PROXY_ERROR))
    }
    return res.data
  },
  (err) => {
    const status = err.response?.status as number | undefined
    const contentType = String(err.response?.headers?.['content-type'] ?? '')
    const data = err.response?.data

    if (isPreviewAccessDenied(contentType, data, status)) {
      return Promise.reject(new Error(PREVIEW_ERROR))
    }

    if (isHtmlResponse(contentType, data)) {
      return Promise.reject(new Error(PROXY_ERROR))
    }

    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (router.currentRoute.value.name !== 'login') {
        router.replace({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
      }
    }
    return Promise.reject(err)
  },
)

export default http
