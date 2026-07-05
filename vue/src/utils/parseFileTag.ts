import type { ExcelColumnHead } from '@/utils/excelExport'

/** 解析后的 file 标签数据（对齐 Web File 组件 props） */
export interface ParsedFileTag {
  fileType: string
  head?: ExcelColumnHead[]
  data?: Record<string, unknown>[]
  filename?: string
  /** head/data 属性是否已完整（流式输出中可能尚未闭合） */
  ready: boolean
}

/**
 * 解码 HTML 实体（AI 消息中 JSON 属性常经实体编码）
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/**
 * 解析 JSON 属性值（与 Web h6() 一致：字符串则 JSON.parse，否则原样返回）
 */
function parseJsonAttr(raw: string | undefined): unknown {
  if (!raw) return undefined
  const decoded = decodeHtmlEntities(raw.trim())
  try {
    return JSON.parse(decoded)
  } catch {
    return undefined
  }
}

/**
 * 读取带引号的 HTML 属性值（支持 &quot; 等实体）
 */
function readQuotedAttrValue(source: string, quotePos: number): { value: string; endPos: number } | null {
  const quote = source[quotePos]
  if (quote !== '"' && quote !== "'") return null

  let pos = quotePos + 1
  let value = ''
  while (pos < source.length) {
    if (source[pos] === '&') {
      if (source.startsWith('&quot;', pos)) {
        value += '"'
        pos += 6
        continue
      }
      if (source.startsWith('&amp;', pos)) {
        value += '&'
        pos += 5
        continue
      }
      if (source.startsWith('&lt;', pos)) {
        value += '<'
        pos += 4
        continue
      }
      if (source.startsWith('&gt;', pos)) {
        value += '>'
        pos += 4
        continue
      }
    }
    if (source[pos] === quote) {
      return { value, endPos: pos + 1 }
    }
    value += source[pos]
    pos++
  }
  return { value, endPos: pos }
}

/** 从属性字符串解析 file 标签各字段 */
function parseFileAttrs(attrs: Record<string, string>): ParsedFileTag {
  const headRaw = parseJsonAttr(attrs.head)
  const dataRaw = parseJsonAttr(attrs.data)

  return {
    fileType: attrs.type || 'file',
    head: Array.isArray(headRaw) ? (headRaw as ExcelColumnHead[]) : undefined,
    data: Array.isArray(dataRaw) ? (dataRaw as Record<string, unknown>[]) : undefined,
    filename: attrs.filename,
    ready: Array.isArray(headRaw) && Array.isArray(dataRaw) && headRaw.length > 0 && dataRaw.length > 0,
  }
}

/**
 * 查找并解析下一个 `<file ...>` 标签
 * 支持 `<file ... />` 与 `<file ...></file>` 两种写法
 */
export function findNextFileTag(
  source: string,
  fromIndex = 0,
): { start: number; end: number; tag: ParsedFileTag } | null {
  const start = source.indexOf('<file', fromIndex)
  if (start < 0) return null

  let pos = start + 5
  const attrs: Record<string, string> = {}

  while (pos < source.length) {
    while (pos < source.length && /\s/.test(source[pos]!)) pos++

    if (source[pos] === '>' || source.startsWith('/>', pos)) break

    const nameMatch = source.slice(pos).match(/^([a-zA-Z_][\w-]*)\s*=/)
    if (!nameMatch) break

    const name = nameMatch[1]!
    pos += nameMatch[0].length

    const quoted = readQuotedAttrValue(source, pos)
    if (!quoted) break

    attrs[name] = quoted.value
    pos = quoted.endPos
  }

  let end = pos
  if (source.startsWith('/>', pos)) {
    end = pos + 2
  } else if (source[pos] === '>') {
    pos++
    const closeIdx = source.indexOf('</file>', pos)
    end = closeIdx >= 0 ? closeIdx + 7 : pos
  } else {
    return null
  }

  return { start, end, tag: parseFileAttrs(attrs) }
}

/** 判断字符串是否包含 file 标签起始（流式输出时用于占位展示） */
export function hasIncompleteFileTag(source: string): boolean {
  return source.includes('<file')
}
