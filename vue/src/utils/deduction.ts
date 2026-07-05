import type { DeductionRecord } from '@/types/api'
import { downloadExcelFromTableData, type ExcelColumnHead } from '@/utils/excelExport'

/** 扣分明细导出列，对齐 Web /application/deductionList 表格 */
export const DEDUCTION_EXPORT_COLUMNS: ExcelColumnHead[] = [
  { props: 'index', label: '序号', width: '8' },
  { props: 'organization_name', label: '责任单位', width: '28' },
  { props: 'cfwh_no', label: '处罚文号', width: '34' },
  { props: 'standard_type', label: '标准类型', width: '16' },
  { props: 'document_name', label: '文书名称', width: '22' },
  { props: 'standard_id', label: '标准编号', width: '20' },
  { props: 'deduction_description', label: '扣分说明', width: '30' },
  { props: 'deduction_score', label: '扣除分数', width: '12' },
  { props: 'remaining_score', label: '剩余分数', width: '12' },
  { props: 'created_at', label: '创建时间', width: '22' },
]

/** 格式化创建时间，对齐 Web：YYYY-MM-DD HH:mm:ss */
export function formatDeductionCreatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/**
 * 按 task_id 累计扣减后写入 remaining_score
 * 逻辑对齐 Web deductionList 页（每项从 100 分起扣）
 */
export function attachRemainingScores(items: DeductionRecord[]): DeductionRecord[] {
  const balanceMap = new Map<number, number>()

  return items.map((item) => {
    if (!balanceMap.has(item.task_id)) balanceMap.set(item.task_id, 100)
    if (item.deduction_score > 0) {
      const next = Math.max(0, balanceMap.get(item.task_id)! - item.deduction_score)
      balanceMap.set(item.task_id, next)
    }
    return {
      ...item,
      remaining_score: Number(balanceMap.get(item.task_id)!.toFixed(2)),
    }
  })
}

/**
 * 导出扣分明细为 xlsx，列与 Web 端 deductionList 导出一致
 * @param items 当前列表（需已 attachRemainingScores）
 * @param year 筛选年度
 * @param quarter 筛选季度（1-4）
 */
export function exportDeductionListToExcel(
  items: DeductionRecord[],
  year: number,
  quarter: number,
): void {
  const rows = items.map((item, index) => ({
    index: index + 1,
    organization_name: item.organization_name ?? '',
    cfwh_no: item.cfwh_no ?? '',
    standard_type: item.standard_type ?? '',
    document_name: item.document_name ?? '',
    standard_id: item.standard_id ?? '',
    deduction_description: item.deduction_description ?? '',
    deduction_score: item.deduction_score,
    remaining_score: item.remaining_score ?? '',
    created_at: item.created_at ? formatDeductionCreatedAt(item.created_at) : '',
  }))

  downloadExcelFromTableData(
    DEDUCTION_EXPORT_COLUMNS,
    rows,
    `扣分明细_${year}Q${quarter}`,
  )
}
