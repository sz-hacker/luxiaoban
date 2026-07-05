/** 案卷评查状态文案映射 */
export const CASE_STATUS_LABELS: Record<number, string> = {
  0: '待评查',
  1: '评查中',
  2: '已完成',
}

/** 获取案卷状态显示文案 */
export function getCaseStatusLabel(status: number): string {
  return CASE_STATUS_LABELS[status] ?? '未知'
}
