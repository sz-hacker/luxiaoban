import type { TaskListParams, TaskRecord } from '@/types/api'
import { getTaskList } from '@/api'
import { downloadExcelFromTableData, type ExcelColumnHead } from '@/utils/excelExport'
import { formatTaskCreatedAt, formatTaskEndDate } from '@/utils/task'

/** 任务周期选项，对齐 Web task_cycle_options */
export const TASK_CYCLE_OPTIONS = [
  { value: 0, label: '无' },
  { value: 7, label: '按周' },
  { value: 30, label: '按月' },
  { value: 90, label: '按季度' },
  { value: 180, label: '按半年' },
  { value: 365, label: '按年' },
] as const

/** 任务模板状态，对齐 Web taskList task_status_options */
export const TASK_TEMPLATE_STATUS_OPTIONS = [
  { value: 10, label: '未开始' },
  { value: 20, label: '进行中' },
  { value: 80, label: '已完成' },
] as const

/** 任务类型，对齐 Web add-dialog */
export const TASK_TYPE_OPTIONS = [
  { value: 'department', label: '科室任务' },
  { value: 'general', label: '综合任务' },
  { value: 'personal', label: '个人任务' },
] as const

/** 统一关键词 OR 搜索字段 */
const UNIFIED_SEARCH_FIELDS = ['title', 'company_name', 'content', 'user_name'] as const

/** 导出单次拉取上限，对齐 Web page_size=2000 */
const EXPORT_PAGE_SIZE = 2000

/** 列表筛选条件（移动端） */
export interface TaskTemplateFilters {
  keyword: string
  cycle_period: number | null
  status: number | null
}

/** 获取任务周期文案 */
export function getTaskCycleLabel(cyclePeriod: number) {
  return TASK_CYCLE_OPTIONS.find((item) => item.value === cyclePeriod)?.label ?? `${cyclePeriod}天`
}

/** 获取任务模板状态文案 */
export function getTaskTemplateStatusLabel(status: number) {
  return TASK_TEMPLATE_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? '未知'
}

/** 获取任务类型文案 */
export function getTaskTypeLabel(taskType: string) {
  return TASK_TYPE_OPTIONS.find((item) => item.value === taskType)?.label ?? taskType
}

/** van-tag 样式，对齐 Web 任务模板状态色 */
export function getTaskTemplateStatusTagProps(status: number): {
  type?: 'primary' | 'success' | 'warning' | 'danger'
  plain?: boolean
} {
  switch (status) {
    case 10:
      return { plain: true }
    case 20:
      return { type: 'primary' }
    case 80:
      return { type: 'success' }
    default:
      return { plain: true }
  }
}

/** 格式化任务有效期区间 */
export function formatTaskTimeRange(startTime: number, endTime: number) {
  const start = formatTaskEndDate(startTime)
  const end = formatTaskEndDate(endTime)
  if (start === '—' && end === '—') return '—'
  return `${start} ~ ${end}`
}

/** 构建单字段 API 搜索参数 */
function buildSingleFieldParam(
  field: (typeof UNIFIED_SEARCH_FIELDS)[number],
  keyword: string,
): Pick<TaskListParams, 'title' | 'company_name' | 'content' | 'user_name'> {
  const k = keyword.trim()
  if (!k) return {}
  return { [field]: k }
}

/** 附加周期/状态筛选到 API 参数 */
function appendExtraFilters(
  params: TaskListParams,
  filters: Pick<TaskTemplateFilters, 'cycle_period' | 'status'>,
): TaskListParams {
  if (filters.cycle_period != null) params.cycle_period = filters.cycle_period
  if (filters.status != null) params.status = filters.status
  return params
}

/** 判断任务是否匹配统一关键词（本地兜底） */
export function matchesTaskTemplateKeyword(item: TaskRecord, keyword: string): boolean {
  const k = keyword.trim().toLowerCase()
  if (!k) return true
  return UNIFIED_SEARCH_FIELDS.some((field) => (item[field] ?? '').toLowerCase().includes(k))
}

/** 本地附加周期/状态筛选 */
function applyLocalExtraFilters(items: TaskRecord[], filters: TaskTemplateFilters): TaskRecord[] {
  return items.filter((item) => {
    if (filters.cycle_period != null && item.cycle_period !== filters.cycle_period) return false
    if (filters.status != null && item.status !== filters.status) return false
    return matchesTaskTemplateKeyword(item, filters.keyword)
  })
}

/** 合并 OR 搜索结果并按 id 降序 */
function mergeTaskRecords(items: TaskRecord[]): TaskRecord[] {
  const map = new Map<number, TaskRecord>()
  for (const item of items) map.set(item.id, item)
  return [...map.values()].sort((a, b) => b.id - a.id)
}

/**
 * 四字段 OR 搜索 + 周期/状态筛选
 * @param filters 移动端筛选条件
 */
async function fetchTaskTemplatesMerged(filters: TaskTemplateFilters): Promise<TaskRecord[]> {
  const k = filters.keyword.trim()
  const extra = { cycle_period: filters.cycle_period, status: filters.status }

  if (!k) {
    const res = await getTaskList(
      appendExtraFilters({ page: 1, page_size: EXPORT_PAGE_SIZE }, extra),
    )
    if (res.code !== 200) throw new Error(res.message || '加载失败')
    return res.data
  }

  const responses = await Promise.all(
    UNIFIED_SEARCH_FIELDS.map((field) =>
      getTaskList(
        appendExtraFilters(
          { page: 1, page_size: EXPORT_PAGE_SIZE, ...buildSingleFieldParam(field, k) },
          extra,
        ),
      ),
    ),
  )

  const merged: TaskRecord[] = []
  for (const res of responses) {
    if (res.code === 200) merged.push(...res.data)
  }
  return applyLocalExtraFilters(mergeTaskRecords(merged), filters)
}

/**
 * 分页拉取任务模板列表
 * @param filters 关键词 + 周期/状态筛选
 */
export async function fetchTaskTemplatesPage(
  filters: TaskTemplateFilters,
  page: number,
  pageSize: number,
): Promise<{ list: TaskRecord[]; total: number }> {
  const hasKeyword = Boolean(filters.keyword.trim())
  const hasExtra = filters.cycle_period != null || filters.status != null

  if (!hasKeyword && !hasExtra) {
    const res = await getTaskList({ page, page_size: pageSize })
    if (res.code !== 200) throw new Error(res.message || '加载失败')
    return { list: res.data, total: res.total ?? res.data.length }
  }

  const all = await fetchTaskTemplatesMerged(filters)
  const start = (page - 1) * pageSize
  return { list: all.slice(start, start + pageSize), total: all.length }
}

/** 拉取全量任务模板（导出用） */
export async function fetchAllTaskTemplates(filters: TaskTemplateFilters): Promise<TaskRecord[]> {
  return fetchTaskTemplatesMerged(filters)
}

/** 任务模板导出列，对齐 Web 导出字段 */
export const TASK_TEMPLATE_EXPORT_COLUMNS: ExcelColumnHead[] = [
  { props: 'title', label: '任务来源', width: '24' },
  { props: 'user_name', label: '负责人', width: '20' },
  { props: 'company_name', label: '企业名称', width: '20' },
  { props: 'content', label: '任务内容', width: '30' },
  { props: 'cycle_label', label: '任务周期', width: '14' },
  { props: 'status_label', label: '任务状态', width: '14' },
  { props: 'start_time', label: '开始时间', width: '14' },
  { props: 'end_time', label: '结束时间', width: '14' },
  { props: 'created_at', label: '录入时间', width: '22' },
]

/** 将 TaskRecord 转为导出行 */
export function mapTaskRecordToExportRow(item: TaskRecord): Record<string, unknown> {
  return {
    title: item.title ?? '',
    user_name: item.user_name ?? '',
    company_name: item.company_name ?? '',
    content: item.content ?? '',
    cycle_label: getTaskCycleLabel(item.cycle_period),
    status_label: getTaskTemplateStatusLabel(item.status),
    start_time: item.start_time ? formatTaskEndDate(item.start_time) : '',
    end_time: item.end_time ? formatTaskEndDate(item.end_time) : '',
    created_at: item.created_at ? formatTaskCreatedAt(item.created_at) : '',
  }
}

/** 导出任务模板 Excel */
export function exportTaskTemplatesToExcel(items: TaskRecord[]): void {
  const rows = items.map((item) => mapTaskRecordToExportRow(item))
  downloadExcelFromTableData(TASK_TEMPLATE_EXPORT_COLUMNS, rows, '任务.xlsx')
}
