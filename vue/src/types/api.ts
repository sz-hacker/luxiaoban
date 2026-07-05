/** API 通用响应结构 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  total?: number
  page?: number
  page_size?: number
}

/** 登录响应 */
export interface LoginData {
  access_token: string
  token_type: string
  user_id: number
  username: string
  name: string
  avatar: string
  dept_id: number
}

/** 案卷记录 */
export interface CaseRecord {
  id: number
  organization_name: string
  case_no: string
  lian_no: string
  cfwh_no: string
  party_name: string
  address: string
  legal_person: string
  status: number
  progress: number
  created_at: string
}

/** 扣分明细 */
export interface DeductionRecord {
  id: number
  task_id: number
  organization_name: string
  cfwh_no: string
  standard_type: string
  document_name: string
  standard_id: string
  deduction_description: string
  deduction_score: number
  created_at: string
  /** 剩余分数（前端按 task_id 累计计算） */
  remaining_score?: number
}

/** 扣分明细列表筛选参数 */
export interface DeductionListParams {
  year?: number
  quarter?: number
  page?: number
  page_size?: number
  organization_name?: string
  cfwh_no?: string
}

/** 创建任务列表项（/tasks/list） */
export interface TaskRecord {
  id: number
  title: string
  content: string
  company_name: string
  task_type: string
  user_id: number
  user_name: string
  cycle_period: number
  start_time: number
  end_time: number
  status: number
  created_at: number
  updated_at: number
}

/** 任务模板列表筛选（对齐 Web /task/taskList 搜索区） */
export interface TaskListParams {
  page?: number
  page_size?: number
  title?: string
  company_name?: string
  content?: string
  user_name?: string
  cycle_period?: number
  status?: number
}

/** 新建/编辑任务模板入参（对齐 Web tasks/add、tasks/update） */
export interface TaskFormPayload {
  id?: number
  title: string
  company_name: string
  content: string
  task_type: 'personal' | 'department' | 'general'
  user_id: number
  cycle_period: number
  /** Unix 秒级时间戳 */
  start_time: number
  end_time: number
}

/** 账号列表项（经办人选择，/accounts/list） */
export interface AccountRecord {
  id: number
  name: string
  username: string
  label?: string
}

/** 待办/已办任务 */
export interface TaskTodo {
  id: number
  task_id: number
  title: string
  content: string
  company_name: string
  user_name: string
  end_time: number
  status: number
  created_at: number
}

/** 待办/已办任务列表筛选参数（对齐 Web expirationReminder/done） */
export interface TaskTodoListParams {
  /** -2 全部待办, 80 已办 */
  status: number
  page?: number
  page_size?: number
  /** 任务来源 */
  title?: string
  /** 企业名称 */
  company_name?: string
  /** 任务内容 */
  content?: string
  /** 经办人 */
  user_name?: string
}

/** 任务到期统计 */
export interface TaskStatusCount {
  count_today: number
  count_three: number
  count_week: number
  count_delay: number
}

/** 紧急程度分布项 */
export interface UrgentItem {
  status: string
  statusName: string
  count: number
}

/** 任务类型分布 */
export interface TypeDistribution {
  taskType: string
  count: number
  percentage: number
}

/** 任务来源分布项 */
export interface SourceDistributionItem {
  title: string
  count: number
}

/** 任务趋势项 */
export interface TaskTrendItem {
  date: string
  newCount: number
  doneCount: number
}

/** 重置密码请求参数 */
export interface ResetPasswordParams {
  old_password: string
  new_password: string
}

/** 修改头像请求参数 */
export interface ChangeAvatarParams {
  avatar: string
}

/** 上传文件响应（头像/案卷等通用） */
export interface UploadFileData {
  url: string
  file_url: string
  filename: string
}

/** 案卷列表筛选参数 */
export interface CaseListParams {
  page: number
  page_size: number
  organization_name?: string
  cfwh_no?: string
  lian_no?: string
  party_name?: string
}