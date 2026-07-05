/** SSE 事件 JSON 结构（对齐 PC agent-chat/chat 流） */
export interface SseEventPayload {
  event: string
  data: {
    content?: string
    status?: string
    reasoning?: string
    [key: string]: unknown
  }
  timestamp?: string
}

/**
 * 从 fetch body 读取 SSE 流
 * 对齐 PC 端 wM（按行缓冲）+ EM（空行分派 JSON）TransformStream 管线
 */
export async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (payload: SseEventPayload) => void,
  signal?: AbortSignal,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  /** 多行 data 字段累积缓冲 */
  let dataBuffer = ''
  /** 未读完的一行尾部 */
  let lineCarry = ''

  /** 将 dataBuffer 解析为 JSON 并分派 */
  const flush = () => {
    const trimmed = dataBuffer.trim()
    dataBuffer = ''
    if (!trimmed) return
    try {
      onEvent(JSON.parse(trimmed) as SseEventPayload)
    } catch {
      /* 与 PC 一致：解析失败跳过 */
    }
  }

  /** 处理单行 SSE 文本 */
  const processLine = (line: string) => {
    if (line === '') {
      flush()
      return
    }
    if (line.startsWith(':')) return
    if (line.startsWith('data: ')) {
      dataBuffer += line.slice(6) + '\n'
    } else if (line.startsWith('data:')) {
      dataBuffer += line.slice(5) + '\n'
    }
  }

  while (true) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    const { done, value } = await reader.read()
    const chunk = lineCarry + decoder.decode(value ?? new Uint8Array(), { stream: !done })
    if (done) {
      lineCarry = ''
      if (chunk) {
        for (const line of chunk.split(/\r?\n/)) {
          processLine(line)
        }
      }
      flush()
      break
    }

    const lines = chunk.split(/\r?\n/)
    lineCarry = lines.pop() ?? ''

    for (const line of lines) {
      processLine(line)
    }
  }
}

/**
 * 解析 sse.txt 等完整文本（用于本地验证）
 */
export function parseSseText(
  text: string,
  onEvent: (payload: SseEventPayload) => void,
): void {
  for (const line of text.split(/\r?\n/)) {
    if (line === '') continue
    if (!line.startsWith('data:')) continue
    const json = line.startsWith('data: ') ? line.slice(6) : line.slice(5)
    try {
      onEvent(JSON.parse(json.trim()) as SseEventPayload)
    } catch {
      /* skip */
    }
  }
}
