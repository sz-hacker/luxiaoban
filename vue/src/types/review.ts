/** 案卷文书目录项（GET /parse-tasks/:id） */
export interface CaseDirectoryEntry {
  title: string
  category: string
  pages: number[]
  organization?: string
  sdhz_pages?: number[]
}

/** 案卷 PDF 文件信息 */
export interface CaseFileInfo {
  filename: string
  url: string
  size: number
  hash?: string
}

/** 合规性扣分项 */
export interface ComplianceReviewItem {
  title?: string
  category: string
  standard_id: string
  deduction_description: string
  deduction_score: number
  problem_page?: number
  review_item_id?: string
}

/** 穿透性评查项 */
export interface PenetrateReviewItem {
  title?: string
  standard_id: string
  dimension: string
  review_content: string
  review_element: string
  standard_quote?: string
  problem_description: string
  pages: string
}

/** 评查流某一维度 */
export interface ReviewStreamSection<T = unknown> {
  list: T[]
  status: 'running' | 'complete' | string
}

/** GET /parse-tasks/:id/stream 响应 data */
export interface ReviewStreamData {
  legality: ReviewStreamSection
  compliance: ReviewStreamSection<ComplianceReviewItem>
  penetrate: ReviewStreamSection<PenetrateReviewItem>
  status: string
}

/** 单次评查快照（detail.content 中每个时间戳对应一条） */
export interface ReviewRoundContent {
  version?: number
  compliance?: ComplianceReviewItem[]
  penetrate?: PenetrateReviewItem[]
  legality?: unknown[]
  elapsed?: number
  compliance_message?: string
  messages?: {
    compliance?: string
    penetrate?: string
    legality?: string
  }
}

/** GET /parse-tasks/:id 详情（评查流程页主数据） */
export interface ParseTaskDetail {
  id: number
  organization_name: string
  cfwh_no: string
  lian_no: string
  party_name: string
  status: number
  progress: number
  directory?: CaseDirectoryEntry[]
  file_info?: CaseFileInfo
  /** 历次评查结果，key 为评查完成时间 */
  content?: Record<string, ReviewRoundContent>
}

/** 评查轮次（对齐 Web「第 N 次评查」） */
export interface ReviewRound {
  /** 唯一标识：时间戳或 live */
  id: string
  /** 第几次评查（从 1 起） */
  roundIndex: number
  title: string
  timestamp: string
  elapsed?: number
  compliance: ComplianceReviewItem[]
  penetrate: PenetrateReviewItem[]
  complianceMessage?: string
  penetrateMessage?: string
  /** 是否正在评查中（来自 stream 轮询） */
  isLive?: boolean
  complianceStatus?: string
  penetrateStatus?: string
}

export type ReviewSubTabKey = 'compliance' | 'penetrate'

/** 单次评查下的子 Tab（对齐 Web 展开面板） */
export const REVIEW_SUB_TABS: { key: ReviewSubTabKey; label: string }[] = [
  { key: 'compliance', label: '合规性评查' },
  { key: 'penetrate', label: '穿透性评查' },
]
