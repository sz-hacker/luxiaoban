import { readSseStream } from '@/utils/sseStream'
import { getUploadOneUrl, isVercelUploadProxy, vercelUploadSizeError } from '@/utils/uploadRequest'
import type { ApiResponse } from '@/types/api'
import type {
  AgentDetail,
  ChatAttachment,
  ChatSession,
  PrologueQuestion,
  UploadFileData,
} from '@/types/chat'

/** 案卷评查 Agent 编码（与 Web 端一致） */
export const AGENT_CODE = 'RTUJOGjyMx4n'

/** Web 端当前路径 Header（后端权限/日志用） */
export const AGENT_PAGE_PATH = '/hb/application/RTUJOGjyMx4n'

const API_BASE = import.meta.env.VITE_API_BASE || '/hb/api/v1'

/** 获取 Authorization 请求头 */
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** 获取 Agent 详情 */
export async function getAgentDetail(code = AGENT_CODE) {
  const res = await fetch(`${API_BASE}/agents/detail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ code, refresh: 0 }),
  })
  return res.json() as Promise<ApiResponse<AgentDetail>>
}

/** 获取对话历史列表 */
export async function getChatHistory(agentCode = AGENT_CODE) {
  const res = await fetch(`${API_BASE}/agent-chat/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ agent_code: agentCode }),
  })
  return res.json() as Promise<ApiResponse<ChatSession[]>>
}

/** 获取会话消息列表 */
export async function getChatMessages(code: string, sessionId: string) {
  const res = await fetch(`${API_BASE}/agent-chat/history/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ code, session_id: sessionId, page_size: 300 }),
  })
  return res.json() as Promise<
    ApiResponse<
      {
        role: string
        content: string
        created_at: string
        extra?: {
          modal_type: string
          url: string
          download_url?: string
          filename?: string
          name?: string
          size?: number
        }[]
      }[]
    >
  >
}

/** 生成推荐问题 */
export async function generateQuestions(name: string, description: string, prompt: string) {
  const res = await fetch(`${API_BASE}/agents/generate-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, description, prompt }),
  })
  return res.json() as Promise<ApiResponse<{ prologue_questions: PrologueQuestion[] }>>
}

/**
 * 上传案卷文件（PDF/图片），XHR 上报进度更可靠（代理下 axios total 常为空）
 * @param file 本地文件
 * @param onProgress 上传进度 0-100
 */
export function uploadChatFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ApiResponse<UploadFileData>> {
  const sizeError = vercelUploadSizeError(file.size)
  if (sizeError) {
    return Promise.reject(new Error(sizeError))
  }

  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)
    form.append('file_type', 'chat')

    const xhr = new XMLHttpRequest()
    xhr.open('POST', getUploadOneUrl())
    xhr.timeout = 600_000

    const token = localStorage.getItem('token')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    /** 上报进度：优先用 lengthComputable，否则用 file.size 估算 */
    xhr.upload.addEventListener('progress', (event) => {
      if (!onProgress) return
      const total = event.lengthComputable && event.total > 0 ? event.total : file.size
      if (total <= 0) {
        onProgress(1)
        return
      }
      const percent = Math.round((event.loaded / total) * 100)
      onProgress(Math.min(99, Math.max(1, percent)))
    })

    xhr.addEventListener('load', () => {
      try {
        if (xhr.status === 504) {
          reject(new Error('上传网关超时，请稍后重试'))
          return
        }
        if (xhr.status === 413) {
          const hint = isVercelUploadProxy()
            ? '文件超过 Vercel 代理 4MB 限制，请压缩案卷或配置 Cloudflare 上传代理'
            : '文件过大，上传被拒绝'
          reject(new Error(hint))
          return
        }
        const data = JSON.parse(xhr.responseText) as ApiResponse<UploadFileData>
        onProgress?.(100)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data)
        } else {
          reject(new Error(data.message || `上传失败 (${xhr.status})`))
        }
      } catch {
        reject(new Error('上传响应解析失败'))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('网络错误，上传失败')))
    xhr.addEventListener('timeout', () => reject(new Error('上传超时')))

    onProgress?.(1)
    xhr.send(form)
  })
}

/**
 * 发送对话消息（SSE 流式）
 * @param text 用户输入
 * @param sessionId 会话 ID，新对话传 null
 * @param files 附件列表（上传后的 PDF/图片）
 * @param onChunk 每收到一段内容回调
 * @param signal 取消信号
 */
export async function sendChatMessage(
  text: string,
  sessionId: string | null,
  files: ChatAttachment[],
  onChunk: (content: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  /** 对齐 Web：图片 download_url 为空，PDF 带 download_url */
  const extra = [
    ...files
      .filter((f) => f.modal_type === 'image')
      .map((f) => ({
        modal_type: 'image',
        url: f.url,
        download_url: '',
        filename: f.name,
        size: f.size,
      })),
    ...files
      .filter((f) => f.modal_type === 'file')
      .map((f) => ({
        modal_type: 'file',
        url: f.url,
        download_url: f.download_url || f.url,
        filename: f.name,
        size: f.size,
      })),
  ]

  const res = await fetch(`${API_BASE}/agent-chat/chat`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      'X-Current-Path': AGENT_PAGE_PATH,
      'X-Current-Title': encodeURIComponent('案卷评测'),
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: text, extra }],
      session_id: sessionId,
      agent_code: AGENT_CODE,
      stream: true,
    }),
  })

  if (!res.ok || !res.body) {
    throw new Error('对话请求失败')
  }

  await readSseStream(
    res.body,
    (payload) => {
      if (payload.event === 'message' && payload.data?.content) {
        onChunk(payload.data.content)
      }
    },
    signal,
  )
}
