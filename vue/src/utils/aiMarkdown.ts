import { marked } from 'marked'
import { parsePreviewParams } from '@/utils/chatContent'
import type { ExcelColumnHead } from '@/utils/excelExport'
import { findNextFileTag } from '@/utils/parseFileTag'

/** 与 Web 端 cT 一致：自定义块级 HTML 标签 */
export const CUSTOM_BLOCK_TAGS = [
  'collapse',
  'chart',
  'feedback',
  'customtable',
  'sheettable',
  'invoicename',
  'ordercomparison',
  'end',
  'file',
] as const

/** 解析后的消息片段（对应 Web AIMessage.items） */
export type MessageSegment =
  | { type: 'html'; html: string; key: string }
  | {
      type: 'collapse'
      id: string
      title: string
      loading: boolean
      bodySegments: MessageSegment[]
      key: string
    }
  | {
      type: 'file'
      fileType: string
      head?: ExcelColumnHead[]
      data?: Record<string, unknown>[]
      filename?: string
      ready: boolean
      key: string
    }

/** marked 配置：GFM + 换行，允许内联 HTML（等同 allowDangerousHtml） */
marked.setOptions({
  gfm: true,
  breaks: true,
})

/**
 * LaTeX 分隔符预处理（与 Web Mue 一致）
 * `\(` `\)` → `$`，`\[` `\]` → `$$`
 */
export function preprocessLatex(source: string): string {
  return source
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
}

/**
 * 去掉包裹自定义标签的 <p>（与 Web Lue 一致）
 */
export function unwrapCustomTagParagraphs(html: string): string {
  let result = html
  for (const tag of CUSTOM_BLOCK_TAGS) {
    result = result.replace(new RegExp(`<p>\\s*(<${tag}[^>]*>)`, 'gi'), '$1')
    result = result.replace(new RegExp(`(<\\/${tag}>)\\s*<\\/p>`, 'gi'), '$1')
  }
  return result
}

/**
 * 将 Web 端 preview onclick 转为 data 属性，供 Vue 事件委托
 * preview('pdf',{'pdfUrl':'...','pageNum':1})
 */
export function transformPreviewLinks(html: string): string {
  return html.replace(
    /<a\s[^>]*onclick="preview\('pdf',\{([^}]+)\}\)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_, params: string, label: string) => {
      const preview = parsePreviewParams(params)
      if (!preview) return label
      const url = encodeURIComponent(preview.pdfUrl)
      return `<a href="#" class="md-preview-link" data-preview-pdf="${url}" data-preview-page="${preview.pageNum}">${label}</a>`
    },
  )
}

/** Markdown → HTML，并做 Web 端同款后处理 */
export function renderMarkdownHtml(source: string): string {
  const trimmed = source.trim()
  if (!trimmed) return ''
  let html = marked.parse(trimmed) as string
  html = unwrapCustomTagParagraphs(html)
  html = transformPreviewLinks(html)
  return html
}

/** 解析 collapse 属性 */
function parseCollapseAttrs(attrStr: string): { id: string; title: string } {
  const id = attrStr.match(/\bid="([^"]*)"/)?.[1] ?? `collapse-${Date.now()}`
  const title = attrStr.match(/\btitle="([^"]*)"/)?.[1] ?? ''
  return { id, title }
}

/**
 * 将文本拆分为 html / file 片段（不含 collapse）
 * 对齐 Web remark 插件对 `<file>` 标签的处理
 */
export function parseInlineSegments(text: string, keyPrefix: string): MessageSegment[] {
  if (!text.trim()) return []

  const segments: MessageSegment[] = []
  let lastIndex = 0
  let fileIndex = 0
  let htmlIndex = 0

  while (lastIndex < text.length) {
    const fileMatch = findNextFileTag(text, lastIndex)

    if (!fileMatch || fileMatch.start > text.length) break

    if (fileMatch.start > lastIndex) {
      const htmlPart = text.slice(lastIndex, fileMatch.start)
      const html = renderMarkdownHtml(htmlPart)
      if (html.trim()) {
        segments.push({
          type: 'html',
          html,
          key: `${keyPrefix}-html-${htmlIndex++}`,
        })
      }
    }

    const { tag } = fileMatch
    segments.push({
      type: 'file',
      fileType: tag.fileType,
      head: tag.head,
      data: tag.data,
      filename: tag.filename,
      ready: tag.ready,
      key: `${keyPrefix}-file-${fileIndex++}`,
    })

    lastIndex = fileMatch.end
  }

  if (lastIndex < text.length) {
    const htmlPart = text.slice(lastIndex)
    const html = renderMarkdownHtml(htmlPart)
    if (html.trim()) {
      segments.push({
        type: 'html',
        html,
        key: `${keyPrefix}-html-${htmlIndex++}`,
      })
    }
  }

  return segments
}

/**
 * 解析 AI 消息内容为片段列表
 * 流程对齐 Web：preprocessLatex → remark/marked → unwrap p → 拆分 collapse / file 组件
 */
export function parseAiMessageContent(raw: string): MessageSegment[] {
  if (!raw.trim()) return []

  const source = preprocessLatex(raw)
  const segments: MessageSegment[] = []
  let keyIndex = 0

  const collapseStartRe = /<collapse\s+([^>]*)>/gi
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = collapseStartRe.exec(source)) !== null) {
    if (match.index > lastIndex) {
      const textPart = source.slice(lastIndex, match.index)
      segments.push(...parseInlineSegments(textPart, `seg-${keyIndex}`))
      keyIndex += 1
    }

    const { id, title: startTitle } = parseCollapseAttrs(match[1] ?? '')
    const bodyStart = match.index + match[0].length
    const rest = source.slice(bodyStart)
    const endMatch = rest.match(/<end\s+([^>]*)><\/collapse>/)

    if (endMatch && endMatch.index !== undefined) {
      const body = rest.slice(0, endMatch.index)
      const endTitle = endMatch[1]?.match(/\btitle="([^"]*)"/)?.[1]
      segments.push({
        type: 'collapse',
        id,
        title: endTitle || startTitle,
        loading: false,
        bodySegments: parseInlineSegments(body, `collapse-${id}-${keyIndex}`),
        key: `collapse-${id}-${keyIndex++}`,
      })
      lastIndex = bodyStart + endMatch.index + endMatch[0].length
      collapseStartRe.lastIndex = lastIndex
    } else {
      segments.push({
        type: 'collapse',
        id,
        title: startTitle,
        loading: true,
        bodySegments: parseInlineSegments(rest, `collapse-${id}-${keyIndex}`),
        key: `collapse-${id}-${keyIndex++}`,
      })
      lastIndex = source.length
      break
    }
  }

  if (lastIndex < source.length) {
    segments.push(...parseInlineSegments(source.slice(lastIndex), `seg-${keyIndex}`))
  }

  return segments
}

/**
 * 从 v-html 容器点击事件中解析 PDF 预览参数
 */
export function previewFromClickEvent(e: MouseEvent): { pdfUrl: string; pageNum: number } | null {
  const target = (e.target as HTMLElement | null)?.closest('[data-preview-pdf]') as HTMLElement | null
  if (!target) return null
  e.preventDefault()
  const rawUrl = target.dataset.previewPdf || ''
  let pdfUrl = rawUrl
  try {
    pdfUrl = decodeURIComponent(rawUrl)
  } catch {
    /* 兼容未编码的旧 data 属性 */
  }
  return {
    pdfUrl,
    pageNum: Number(target.dataset.previewPage || 1),
  }
}
