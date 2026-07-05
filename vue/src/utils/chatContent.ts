import type { DirectoryItem, PreviewData } from '@/types/chat'

/** SSE 返回内容中的 PDF 预览链接正则 */
const PREVIEW_LINK_RE =
  /<a\s+onclick="preview\('pdf',\{([^}]+)\}\)">([^<]+)<\/a>/g

/** collapse 开始标签 */
const COLLAPSE_START_RE = /<collapse[^>]*title="([^"]*)"[^>]*>/g

/** collapse 结束标签 */
const COLLAPSE_END_RE = /<end[^>]*><\/collapse>/g

/**
 * 从 onclick 参数字符串解析 PDF 预览数据
 * 示例：'pdfUrl':'https://...','pageNum':1
 */
export function parsePreviewParams(raw: string): PreviewData | null {
  const urlMatch = raw.match(/pdfUrl['"]:\s*['"]([^'"]+)['"]/)
  const pageMatch = raw.match(/pageNum['"]:\s*(\d+)/)
  if (!urlMatch?.[1]) return null
  return {
    pdfUrl: urlMatch[1],
    pageNum: pageMatch?.[1] ? Number(pageMatch[1]) : 1,
  }
}

/** 从助手消息内容中提取文书目录链接 */
export function extractDirectoryLinks(content: string): DirectoryItem[] {
  const items: DirectoryItem[] = []
  let match: RegExpExecArray | null
  PREVIEW_LINK_RE.lastIndex = 0
  while ((match = PREVIEW_LINK_RE.exec(content)) !== null) {
    const params = match[1]
    const label = match[2]
    if (!params || !label) continue
    const preview = parsePreviewParams(params)
    if (!preview) continue
    const trimmed = label.trim()
    const pageMatch = trimmed.match(/（([^）]+)）$/)
    items.push({
      title: trimmed.replace(/（[^）]+）$/, ''),
      pages: pageMatch?.[1] ?? String(preview.pageNum),
      pdfUrl: preview.pdfUrl,
      pageNum: preview.pageNum,
    })
  }
  return items
}

/**
 * 将 SSE 原始 HTML 内容转为可读文本（保留换行，去掉标签）
 * 用于聊天气泡展示
 */
export function formatChatContent(content: string): string {
  return content
    .replace(COLLAPSE_START_RE, '\n【$1】\n')
    .replace(COLLAPSE_END_RE, '\n')
    .replace(PREVIEW_LINK_RE, (_, _params, label) => `📄 ${label}\n`)
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 构建 iframe PDF 预览地址（带页码） */
export function buildPdfViewerUrl(preview: PreviewData): string {
  return `${preview.pdfUrl}#page=${preview.pageNum}`
}

/** 格式化文件大小 */
export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
