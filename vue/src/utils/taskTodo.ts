import type { TaskTodo, TaskTodoListParams } from '@/types/api'
import { getTaskTodos } from '@/api'
import { downloadExcelFromTableData, type ExcelColumnHead } from '@/utils/excelExport'

/** 任务状态文案，对齐 Web expirationReminder */
export const TASK_STATUS_LABELS: Record<number, string> = {
  1: '今天到期',
  3: '3天内到期',
  7: '7天内到期',
  [-1]: '已超期',
  10: '待办',
  80: '已完成',
}

/** 获取任务状态显示文案 */
export function getTaskStatusLabel(status: number): string {
  return TASK_STATUS_LABELS[status] ?? '未知'
}

/** Unix 时间戳 → YYYY-MM-DD */
export function formatTaskDate(ts: number): string {
  const date = new Date(ts * 1000)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Unix 时间戳 → YYYY-MM-DD HH:mm:ss（录入时间） */
export function formatTaskDateTime(ts: number): string {
  const date = new Date(ts * 1000)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 已办任务导出列，对齐 Web /task/expirationReminder/done */
export const TASK_DONE_EXPORT_COLUMNS: ExcelColumnHead[] = [
  { props: 'title', label: '任务来源', width: '24' },
  { props: 'company_name', label: '企业名称', width: '20' },
  { props: 'content', label: '任务内容', width: '30' },
  { props: 'status_label', label: '任务状态', width: '14' },
  { props: 'end_time', label: '到期时间', width: '14' },
  { props: 'created_at', label: '录入时间', width: '22' },
  { props: 'user_name', label: '经办人', width: '20' },
]

/** 将 TaskTodo 转为导出行 */
export function mapTaskTodoToExportRow(item: TaskTodo): Record<string, unknown> {
  return {
    title: item.title ?? '',
    company_name: item.company_name ?? '',
    content: item.content ?? '',
    status_label: getTaskStatusLabel(item.status),
    end_time: item.end_time ? formatTaskDate(item.end_time) : '',
    created_at: item.created_at ? formatTaskDateTime(item.created_at) : '',
    user_name: item.user_name ?? '',
  }
}

/** 已办任务 status=80 */
const DONE_STATUS = 80

/** OR 搜索单次拉取上限，对齐 Web 导出 page_size=2000 */
const DONE_OR_SEARCH_PAGE_SIZE = 2000

/** 统一搜索匹配的四个字段：任务来源 / 企业名称 / 任务内容 / 经办人 */
const DONE_UNIFIED_SEARCH_FIELDS = ['title', 'company_name', 'content', 'user_name'] as const

/** 构建单字段 API 搜索参数 */
function buildSingleFieldParam(
  field: (typeof DONE_UNIFIED_SEARCH_FIELDS)[number],
  keyword: string,
): Pick<TaskTodoListParams, 'title' | 'company_name' | 'content' | 'user_name'> {
  const k = keyword.trim()
  if (!k) return {}
  return { [field]: k }
}

/** 判断任务是否匹配统一关键词（本地兜底校验） */
export function matchesDoneTaskKeyword(item: TaskTodo, keyword: string): boolean {
  const k = keyword.trim().toLowerCase()
  if (!k) return true
  return DONE_UNIFIED_SEARCH_FIELDS.some((field) =>
    (item[field] ?? '').toLowerCase().includes(k),
  )
}

/** 合并 OR 搜索结果并按 id 降序 */
function mergeDoneTasks(items: TaskTodo[]): TaskTodo[] {
  const map = new Map<number, TaskTodo>()
  for (const item of items) {
    map.set(item.id, item)
  }
  return [...map.values()].sort((a, b) => b.id - a.id)
}

/**
 * 四字段 OR 搜索拉取全量（各字段并行查询后去重合并）
 * @param keyword 统一搜索关键词
 */
async function fetchDoneTasksOrMerged(keyword: string): Promise<TaskTodo[]> {
  const k = keyword.trim()
  if (!k) {
    const res = await getTaskTodos({
      status: DONE_STATUS,
      page: 1,
      page_size: DONE_OR_SEARCH_PAGE_SIZE,
    })
    if (res.code !== 200) throw new Error(res.message || '加载失败')
    return res.data
  }

  const responses = await Promise.all(
    DONE_UNIFIED_SEARCH_FIELDS.map((field) =>
      getTaskTodos({
        status: DONE_STATUS,
        page: 1,
        page_size: DONE_OR_SEARCH_PAGE_SIZE,
        ...buildSingleFieldParam(field, k),
      }),
    ),
  )

  const merged: TaskTodo[] = []
  for (const res of responses) {
    if (res.code === 200) merged.push(...res.data)
  }
  return mergeDoneTasks(merged).filter((item) => matchesDoneTaskKeyword(item, k))
}

/**
 * 分页拉取已办任务（支持统一关键词 OR 搜索）
 * @param keyword 统一搜索关键词，匹配任务来源/企业名称/任务内容/经办人
 */
export async function fetchDoneTasksPage(
  keyword: string,
  page: number,
  pageSize: number,
): Promise<{ list: TaskTodo[]; total: number }> {
  const k = keyword.trim()
  if (!k) {
    const res = await getTaskTodos({ status: DONE_STATUS, page, page_size: pageSize })
    if (res.code !== 200) throw new Error(res.message || '加载失败')
    return { list: res.data, total: res.total ?? res.data.length }
  }

  const all = await fetchDoneTasksOrMerged(k)
  const start = (page - 1) * pageSize
  return { list: all.slice(start, start + pageSize), total: all.length }
}

/**
 * 拉取全量已办任务（导出用，对齐 Web page_size=2000）
 * @param keyword 统一搜索关键词
 */
export async function fetchAllDoneTasks(keyword = ''): Promise<TaskTodo[]> {
  return fetchDoneTasksOrMerged(keyword)
}

/** 导出已办任务 Excel */
export function exportTaskDoneToExcel(items: TaskTodo[]): void {
  const rows = items.map((item) => mapTaskTodoToExportRow(item))
  downloadExcelFromTableData(TASK_DONE_EXPORT_COLUMNS, rows, '已办任务.xlsx')
}
