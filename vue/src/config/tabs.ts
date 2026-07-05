/** 底部 Tab 项配置（icon 为 Vant Tabbar 内置图标名） */
export interface TabItem {
  path: string
  label: string
  icon: string
}

/** 底部 5 个 Tab，顺序即切换动画方向依据 */
export const TAB_ITEMS: TabItem[] = [
  { path: '/', label: '首页', icon: 'home-o' },
  { path: '/cases', label: '案卷', icon: 'notes-o' },
  { path: '/ai', label: 'AI', icon: 'chat-o' },
  { path: '/tasks', label: '任务', icon: 'todo-list-o' },
  { path: '/profile', label: '我的', icon: 'user-o' },
]

/** 案卷模块子路由，均归属「案卷」Tab */
export const CASE_MODULE_PATHS = ['/cases', '/deductions'] as const

/** 任务模块子路由，均归属「任务」Tab */
export const TASK_MODULE_PATHS = [
  '/tasks/create',
  '/tasks/pending',
  '/tasks/done',
  '/tasks/stats',
] as const

/** 根据当前路径解析激活的 Tab path */
export function resolveActiveTabPath(path: string): string {
  if (CASE_MODULE_PATHS.some((p) => path.startsWith(p))) return '/cases'
  if (path.startsWith('/ai')) return '/ai'
  if (path.startsWith('/tasks')) return '/tasks'
  if (path.startsWith('/profile')) return '/profile'
  return '/'
}

/** 获取 Tab 顺序索引，用于路由切换动画；非 Tab 页返回 undefined */
export function getTabOrderIndex(path: string): number | undefined {
  const activePath = resolveActiveTabPath(path)
  const index = TAB_ITEMS.findIndex((tab) => tab.path === activePath)
  return index >= 0 ? index : undefined
}

/**
 * 顶层 RouterView 的 key：同一模块内切换子 Tab 时保持不变，避免布局整页卸载
 */
export function getRouteOutletKey(path: string): string {
  if (CASE_MODULE_PATHS.some((p) => path === p)) return '__case-module__'
  if (path.startsWith('/tasks')) return '__task-module__'
  return path
}
