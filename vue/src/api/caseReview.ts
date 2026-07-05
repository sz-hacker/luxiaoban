import { uploadChatFile } from './chat'
import http from './http'
import { readSseStream } from '@/utils/sseStream'
import type { ApiResponse } from '@/types/api'
import type { ParseTaskDetail, ReviewStreamData } from '@/types/review'

/** parse-file SSE 步骤与 Web CaseDialog 一致 */
const PARSE_STEP_MAP: Record<string, 'ocr' | 'struct' | 'keywords'> = {
  step1: 'ocr',
  step2: 'struct',
  step3: 'keywords',
}

/** 上传解析进度回调参数 */
export interface CaseParseProgress {
  step: 'ocr' | 'struct' | 'keywords'
  progress: number
  status: 'running' | 'finished' | 'fail'
  title?: string
}

/** 传给 /agent-chat/parse-file 的文件信息 */
export interface CaseParseFileInfo {
  filename: string
  url: string
  size: number
  modal_type: 'file'
  download_url: string
  hash: string
}

/** 检查案卷文件 hash 是否已存在 */
export function checkCaseHash(hash: string) {
  return http.post<unknown, ApiResponse<{ exists: boolean }>>('/parse-tasks/check-hash', { hash })
}

/**
 * 上传案卷 PDF（对齐 Web：file_type=chat）
 * @param file 本地 PDF
 * @param onProgress 上传进度 0-100
 */
export function uploadCasePdf(file: File, onProgress?: (percent: number) => void) {
  return uploadChatFile(file, onProgress)
}

/**
 * 解析已上传案卷（SSE 流，对齐 Web CaseDialog）
 * @param fileInfo 上传成功后返回的文件信息
 * @param onProgress 各步骤进度
 */
export async function parseCaseFileStream(
  fileInfo: CaseParseFileInfo,
  onProgress: (payload: CaseParseProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_BASE || '/hb/api/v1'
  const token = localStorage.getItem('token')

  const res = await fetch(`${baseUrl}/agent-chat/parse-file`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ file_info: [fileInfo] }),
  })

  if (!res.ok || !res.body) {
    throw new Error('案卷解析请求失败')
  }

  await readSseStream(
    res.body,
    (payload) => {
      if (payload.event !== 'progress') return
      const data = payload.data as {
        step?: string
        progress?: number
        status?: string
        title?: string
      }
      const stepKey = data.step
      if (!stepKey) return
      const step = PARSE_STEP_MAP[stepKey]
      if (!step) return
      onProgress({
        step,
        progress: data.progress ?? 0,
        status: (data.status as CaseParseProgress['status']) ?? 'running',
        title: data.title,
      })
    },
    signal,
  )
}

/** 获取案卷评查详情（含目录、PDF、content） */
export function getParseTaskDetail(id: number) {
  return http.get<unknown, ApiResponse<ParseTaskDetail>>(`/parse-tasks/${id}`)
}

/** 获取评查进度与结果（合法性/合规性/穿透性） */
export function getReviewStream(id: number) {
  return http.get<unknown, ApiResponse<ReviewStreamData>>(`/parse-tasks/${id}/stream`)
}

/** 一键评查：异步启动评查任务 */
export function startReviewAsync(id: number) {
  return http.post<unknown, ApiResponse<{ task_id: number; status: number; status_label: string }>>(
    `/parse-tasks/${id}/analyze/async`,
    {},
  )
}

/** 删除案卷 */
export function deleteParseTask(id: number) {
  return http.delete<unknown, ApiResponse<unknown>>(`/parse-tasks/${id}`)
}
