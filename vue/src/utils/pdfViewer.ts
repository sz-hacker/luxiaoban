import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist'

/**
 * pdf.js Worker：构建产物为 /pdf.worker.min.js（见 vite.config copyPdfWorkerPlugin）
 * 避免 EdgeOne 等静态托管将 .mjs 以 application/octet-stream 返回导致预览失败
 */
pdfjsLib.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.js`

/** 需走同源代理的 PDF 域名（百度云 BOS，H5 直连有 CORS/下载问题） */
const PDF_PROXY_HOSTS = ['huanbao.bj.bcebos.com']

/** 文档缓存上限（案卷 PDF 较大，避免占用过多内存） */
const MAX_DOC_CACHE = 4

/** 已解析的 PDF 文档缓存：同源 fetch URL → 文档实例 */
const docCache = new Map<string, PDFDocumentProxy>()

/** 进行中的加载任务（同一 URL 并发请求合并为一次） */
const loadingCache = new Map<string, Promise<PDFDocumentProxy>>()

/** PDF 同源代理前缀（GitHub Pages 演示环境可设为 Cloudflare 代理完整 URL） */
const PDF_PROXY_PREFIX = import.meta.env.VITE_PDF_PROXY_PREFIX || '/pdf-proxy'

/**
 * 将外部 PDF 地址转为可 fetch 的同源 URL
 * 开发环境由 Vite `/pdf-proxy` 转发；生产需在 nginx 或 Cloudflare 代理配置同等转发
 */
export function resolvePdfFetchUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    if (PDF_PROXY_HOSTS.includes(parsed.hostname)) {
      const prefix = PDF_PROXY_PREFIX.replace(/\/$/, '')
      return `${prefix}${parsed.pathname}${parsed.search}`
    }
  } catch {
    /* 非法 URL 原样返回，由上层报错 */
  }
  return rawUrl
}

/** LRU：超出上限时淘汰最早缓存的文档 */
function trimDocCache() {
  while (docCache.size > MAX_DOC_CACHE) {
    const oldestKey = docCache.keys().next().value
    if (!oldestKey) break
    const doc = docCache.get(oldestKey)
    doc?.destroy()
    docCache.delete(oldestKey)
  }
}

/** 加载 PDF 文档（无缓存，仅供内部使用） */
export function loadPdfDocument(rawUrl: string): PDFDocumentLoadingTask {
  return pdfjsLib.getDocument({
    url: resolvePdfFetchUrl(rawUrl),
    withCredentials: false,
  })
}

/**
 * 获取 PDF 文档（带内存缓存 + 加载去重）
 * 同一案卷多次打开预览 / 翻页不再重复下载解析
 * @param rawUrl 原始 PDF 地址
 */
export async function acquirePdfDocument(rawUrl: string): Promise<PDFDocumentProxy> {
  const cacheKey = resolvePdfFetchUrl(rawUrl)

  const hit = docCache.get(cacheKey)
  if (hit) {
    docCache.delete(cacheKey)
    docCache.set(cacheKey, hit)
    return hit
  }

  let pending = loadingCache.get(cacheKey)
  if (!pending) {
    pending = loadPdfDocument(rawUrl)
      .promise.then((doc) => {
        loadingCache.delete(cacheKey)
        docCache.set(cacheKey, doc)
        trimDocCache()
        return doc
      })
      .catch((err) => {
        loadingCache.delete(cacheKey)
        throw err
      })
    loadingCache.set(cacheKey, pending)
  }

  return pending
}

/** 主动清除某 URL 的缓存（一般无需调用） */
export function evictPdfDocument(rawUrl: string) {
  const cacheKey = resolvePdfFetchUrl(rawUrl)
  loadingCache.delete(cacheKey)
  const doc = docCache.get(cacheKey)
  doc?.destroy()
  docCache.delete(cacheKey)
}

export type { PDFDocumentProxy }
