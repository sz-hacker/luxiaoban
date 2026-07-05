import http from './http'
import { edgeoneUploadSizeError, getUploadOneUrl } from '@/utils/uploadRequest'
import type {
  ApiResponse,
  CaseListParams,
  CaseRecord,
  DeductionListParams,
  DeductionRecord,
  LoginData,
  TaskRecord,
  TaskListParams,
  TaskFormPayload,
  AccountRecord,
  TaskStatusCount,
  TaskTodo,
  TaskTodoListParams,
  TaskTrendItem,
  TypeDistribution,
  SourceDistributionItem,
  UrgentItem,
  ResetPasswordParams,
  ChangeAvatarParams,
  UploadFileData,
} from '@/types/api'

/** 用户登录 */
export function login(username: string, password: string) {
  return http.post<unknown, ApiResponse<LoginData>>('/auth/login', { username, password })
}

/** 获取当前用户信息 */
export function getUserInfo() {
  return http.post<unknown, ApiResponse<LoginData>>('/user/get_user_info', {})
}

/** 修改密码（需登录态） */
export function resetPassword(params: ResetPasswordParams) {
  return http.post<unknown, ApiResponse<null>>('/auth/reset-password', params)
}

/** 修改头像（需登录态，对齐 Web /auth/change-avatar） */
export function changeAvatar(params: ChangeAvatarParams) {
  return http.post<unknown, ApiResponse<null>>('/auth/change-avatar', params)
}

/**
 * 上传头像文件（对齐 Web userAvatar：file_type=avatar）
 * @param file 本地图片文件
 */
export function uploadAvatarFile(file: File): Promise<ApiResponse<UploadFileData>> {
  const sizeError = edgeoneUploadSizeError(file.size)
  if (sizeError) return Promise.reject(new Error(sizeError))

  const form = new FormData()
  form.append('file', file, file.name)
  form.append('file_type', 'avatar')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', getUploadOneUrl())
    xhr.timeout = 120_000

    const token = localStorage.getItem('token')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText) as ApiResponse<UploadFileData>
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data)
        } else {
          reject(new Error(data.message || '上传失败'))
        }
      } catch {
        reject(new Error('上传响应解析失败'))
      }
    })
    xhr.addEventListener('error', () => reject(new Error('网络错误，上传失败')))
    xhr.addEventListener('timeout', () => reject(new Error('上传超时')))
    xhr.send(form)
  })
}

/** 评查案卷列表 */
export function getCaseList(params: CaseListParams) {
  return http.post<unknown, ApiResponse<CaseRecord[]>>('/parse-tasks/list', params)
}

/** 扣分明细列表 */
export function getDeductionList(params: DeductionListParams) {
  return http.post<unknown, ApiResponse<DeductionRecord[]>>('/parse-tasks/deductions/list', {
    page: 1,
    page_size: 50,
    ...params,
  })
}

/** 任务模板列表（支持 Web 端搜索字段） */
export function getTaskList(params: TaskListParams = {}) {
  return http.post<unknown, ApiResponse<TaskRecord[]>>('/tasks/list', {
    page: 1,
    page_size: 10,
    ...params,
  })
}

/** 新建任务模板 */
export function addTask(data: TaskFormPayload) {
  return http.post<unknown, ApiResponse<unknown>>('/tasks/add', data)
}

/** 更新任务模板 */
export function updateTask(data: TaskFormPayload & { id: number }) {
  return http.post<unknown, ApiResponse<unknown>>('/tasks/update', data)
}

/** 删除任务模板（支持批量） */
export function deleteTasks(taskIds: number[]) {
  return http.post<unknown, ApiResponse<unknown>>('/tasks/delete', { task_ids: taskIds })
}

/** 任务模板详情 */
export function getTaskDetail(taskId: number) {
  return http.post<unknown, ApiResponse<TaskRecord>>(`/tasks/detail/${taskId}`, {})
}

/** 账号列表（经办人选择） */
export function getAccountsList(page = 1, pageSize = 99) {
  return http.post<unknown, ApiResponse<AccountRecord[]>>('/accounts/list', {
    page,
    page_size: pageSize,
  })
}

/** 待办/已办任务列表，status: -2 全部待办, 80 已办 */
export function getTaskTodos(params: TaskTodoListParams) {
  return http.post<unknown, ApiResponse<TaskTodo[]>>('/task-todos/list', {
    page: 1,
    page_size: 10,
    ...params,
  })
}

/** 任务到期计数 */
export function getTaskStatusCount() {
  return http.post<unknown, ApiResponse<TaskStatusCount>>('/task-todos/status-count', {})
}

/** 紧急程度分布 */
export function getUrgentDistribution() {
  return http.post<unknown, ApiResponse<UrgentItem[]>>(
    '/task-todo-statistics/urgent-distribution',
    {},
  )
}

/** 任务类型分布 */
export function getTypeDistribution() {
  return http.post<unknown, ApiResponse<TypeDistribution[]>>(
    '/task-todo-statistics/type-distribution',
    {},
  )
}

/** 任务来源分布（Top10） */
export function getSourceDistribution() {
  return http.post<unknown, ApiResponse<SourceDistributionItem[]>>(
    '/task-todo-statistics/source-distribution',
    {},
  )
}

/** 任务趋势 */
export function getTaskTrends(days = 30) {
  return http.post<unknown, ApiResponse<TaskTrendItem[]>>(
    '/task-todo-statistics/trends',
    { days },
  )
}
