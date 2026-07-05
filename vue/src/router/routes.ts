import type { RouteRecordRaw } from 'vue-router'

/** 应用路由表 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'welcome',
    component: () => import('@/views/WelcomeView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { hideTabBar: true, guestOnly: true },
  },
  {
    path: '/case-module',
    component: () => import('@/views/cases/CaseLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/cases',
    children: [
      {
        path: '/cases',
        name: 'cases',
        component: () => import('@/views/CaseReviewView.vue'),
      },
      {
        path: '/deductions',
        name: 'deductions',
        component: () => import('@/views/DeductionListView.vue'),
      },
    ],
  },
  {
    path: '/ai',
    name: 'ai',
    component: () => import('@/views/AiChatView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/cases/:id/review',
    name: 'review-process',
    component: () => import('@/views/ReviewProcessView.vue'),
    meta: { requiresAuth: true, hideTabBar: true },
  },
  /** 兼容 Web 评查流程路由 */
  {
    path: '/hb/application/review_process',
    redirect: '/cases',
  },
  /** 兼容 Web 端案卷评测助手路由 */
  {
    path: '/hb/application/RTUJOGjyMx4n',
    redirect: '/ai',
  },
  {
    path: '/tasks',
    component: () => import('@/views/tasks/TaskLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/tasks/pending',
    children: [
      {
        path: 'create',
        name: 'tasks-create',
        component: () => import('@/views/tasks/TaskCreateView.vue'),
      },
      {
        path: 'pending',
        name: 'tasks-pending',
        component: () => import('@/views/tasks/TaskPendingView.vue'),
      },
      {
        path: 'done',
        name: 'tasks-done',
        component: () => import('@/views/tasks/TaskDoneView.vue'),
      },
      {
        path: 'stats',
        name: 'tasks-stats',
        component: () => import('@/views/tasks/TaskStatsView.vue'),
      },
    ],
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
]
