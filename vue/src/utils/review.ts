import type {
  CaseDirectoryEntry,
  ParseTaskDetail,
  ReviewRound,
  ReviewStreamData,
} from '@/types/review'

/** 将页码数组格式化为展示文案，对齐 Web 目录 */
export function formatDirectoryPages(pages: number[]): string {
  if (!pages.length) return ''
  const sorted = [...pages].sort((a, b) => a - b)
  if (sorted.length <= 5) return sorted.join(',')
  return `${sorted.slice(0, 3).join(',')}... 等${sorted.length}页`
}

/** 解析穿透性评查 pages 字符串的首页 */
export function parseFirstPage(pages: string | undefined): number {
  if (!pages) return 1
  const first = pages.split(',')[0]?.trim()
  const num = Number(first)
  return Number.isFinite(num) && num > 0 ? num : 1
}

/** 目录项默认跳转页码 */
export function getDirectoryFirstPage(entry: CaseDirectoryEntry): number {
  return entry.pages.length ? Math.min(...entry.pages) : 1
}

/** 评查维度 status 文案 */
export function getReviewSectionStatusLabel(status: string): string {
  if (status === 'running') return '评查中'
  if (status === 'complete') return '已完成'
  return status
}

/**
 * 从案卷 detail.content 解析历次评查（按时间升序编号，返回降序列表）
 * 对齐 Web：第 1 次最早，列表 newest-first
 */
export function parseReviewRounds(content: ParseTaskDetail['content']): ReviewRound[] {
  if (!content || typeof content !== 'object') return []

  const sorted = Object.entries(content)
    .filter(([, snapshot]) => snapshot && typeof snapshot === 'object')
    .sort(([a], [b]) => a.localeCompare(b))

  return sorted
    .map(([timestamp, snapshot], index) => ({
      id: timestamp,
      roundIndex: index + 1,
      title: `第 ${index + 1} 次评查`,
      timestamp,
      elapsed: snapshot.elapsed,
      compliance: snapshot.compliance ?? [],
      penetrate: snapshot.penetrate ?? [],
      complianceMessage: snapshot.compliance_message || snapshot.messages?.compliance,
      penetrateMessage: snapshot.messages?.penetrate,
    }))
    .reverse()
}

/** 将 stream 实时结果转为「评查中」轮次，置于列表顶部 */
export function buildLiveReviewRound(
  stream: ReviewStreamData,
  roundIndex: number,
): ReviewRound {
  return {
    id: 'live',
    roundIndex,
    title: `第 ${roundIndex} 次评查`,
    timestamp: '评查进行中',
    compliance: stream.compliance.list,
    penetrate: stream.penetrate.list,
    complianceStatus: stream.compliance.status,
    penetrateStatus: stream.penetrate.status,
    isLive: true,
  }
}

/** 格式化耗时展示 */
export function formatReviewElapsed(seconds?: number): string {
  if (seconds == null || !Number.isFinite(seconds)) return ''
  return `耗时 ${seconds}s`
}
