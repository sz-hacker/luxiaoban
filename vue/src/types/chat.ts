/** AI 对话相关类型 */

/** Agent 详情 */
export interface AgentDetail {
  code: string
  name: string
  description: string
  head_image_url: string
  introduction: string
  prompt: string
  opening_question: string[]
}

/** 历史会话 */
export interface ChatSession {
  session_id: string
  title: string
  agent_code: string
  created_at: string
  updated_at: string
}

/** 聊天消息（UI 层） */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  /** 原始 SSE 内容（含 HTML 标签，用于提取目录链接） */
  rawContent?: string
  created_at?: string
  streaming?: boolean
  /** 用户消息附带的文件 */
  files?: ChatAttachment[]
}

/** 上传/发送附件（对齐 Web PdfDialog submit 结构） */
export interface ChatAttachment {
  name: string
  size: number
  url: string
  /** 下载地址，PDF 与 url 相同；图片可为空字符串 */
  download_url?: string
  modal_type: 'file' | 'image'
}

/** PDF 预览参数 */
export interface PreviewData {
  pdfUrl: string
  pageNum: number
}

/** 文书目录项（从 AI 回复中解析） */
export interface DirectoryItem {
  title: string
  pages: string
  pdfUrl: string
  pageNum: number
}

/** 上传接口响应 */
export interface UploadFileData {
  url: string
  file_url: string
  filename: string
}

/** 推荐问题 */
export interface PrologueQuestion {
  question: string
}

/** SSE 事件数据 */
export interface SseChatEvent {
  event: string
  data: {
    status?: string
    content?: string
    object?: string
  }
}
