/** 任务状态选项，对齐 Web expirationReminder 页 task_status_options */
export const TASK_STATUS_OPTIONS = [
  { value: 1, label: '今天到期' },
  { value: 3, label: '3天内到期' },
  { value: 7, label: '7天内到期' },
  { value: -1, label: '已超期' },
  { value: 10, label: '待办' },
  { value: 80, label: '已完成' },
] as const

/** 根据 status 值获取展示文案 */
export function getTaskStatusLabel(status: number) {
  return TASK_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? '未知'
}

/** van-tag 样式，对齐 Web 端状态色 */
export function getTaskStatusTagProps(status: number): {
  type?: 'primary' | 'success' | 'warning' | 'danger'
  color?: string
  plain?: boolean
} {
  switch (status) {
    case 1:
      return { color: '#d81e06' }
    case 3:
      return { color: '#f56c6c' }
    case 7:
      return { color: '#ea9518' }
    case -1:
      return { color: '#6a450e' }
    case 80:
      return { type: 'success' }
    case 10:
      return { color: '#f5b590' }
    default:
      return { plain: true }
  }
}

/** 格式化到期时间，对齐 Web：YYYY-MM-DD */
export function formatTaskEndDate(ts: number) {
  if (!ts) return '—'
  const date = new Date(ts * 1000)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 格式化录入时间，对齐 Web：YYYY-MM-DD HH:mm:ss */
export function formatTaskCreatedAt(ts: number) {
  if (!ts) return '—'
  const date = new Date(ts * 1000)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
