import type { SubNavTabItem } from '@/components/layout/SubNavTabs.vue'

/** 案卷模块二级 Tab */
export const CASE_SUB_NAV_ITEMS: SubNavTabItem[] = [
  { path: '/cases', label: '评查案卷' },
  { path: '/deductions', label: '扣分明细' },
]

/** 任务模块二级 Tab */
export const TASK_SUB_NAV_ITEMS: SubNavTabItem[] = [
  { path: '/tasks/create', label: '创建任务' },
  { path: '/tasks/pending', label: '待办任务' },
  { path: '/tasks/done', label: '已办任务' },
  { path: '/tasks/stats', label: '任务统计' },
]

/** 判断路径是否属于案卷子 Tab */
export function isCaseSubNavPath(path: string): boolean {
  return CASE_SUB_NAV_ITEMS.some((item) => item.path === path)
}

/** 判断路径是否属于任务子 Tab */
export function isTaskSubNavPath(path: string): boolean {
  return TASK_SUB_NAV_ITEMS.some((item) => item.path === path)
}

/** 获取子 Tab 在列表中的索引，未匹配返回 -1 */
export function getSubNavIndex(path: string, items: SubNavTabItem[]): number {
  return items.findIndex((item) => item.path === path)
}
