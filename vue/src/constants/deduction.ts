/** 季度选项，对齐 Web /application/deductionList */
export const DEDUCTION_QUARTER_OPTIONS = [
  { label: '第一季度', value: 1 },
  { label: '第二季度', value: 2 },
  { label: '第三季度', value: 3 },
  { label: '第四季度', value: 4 },
] as const

/** 生成最近 count 个年度（含当前年），Web 端默认 20 年 */
export function buildDeductionYearOptions(count = 20, baseYear = new Date().getFullYear()) {
  return Array.from({ length: count }, (_, index) => baseYear - index)
}

/** 当前季度（1-4） */
export function getCurrentQuarter() {
  return Math.ceil((new Date().getMonth() + 1) / 3)
}

/** 根据季度值取中文标签 */
export function getQuarterLabel(quarter: number) {
  return DEDUCTION_QUARTER_OPTIONS.find((item) => item.value === quarter)?.label ?? `Q${quarter}`
}
