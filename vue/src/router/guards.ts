import type { Router } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { resolveAuthRedirect } from './constants'

/** 注册鉴权相关路由守卫 */
export function setupAuthGuard(router: Router) {
  router.beforeEach((to) => {
    const userStore = useUserStore()

    // 未登录访问受保护页 → 登录
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    // 已登录访问登录页 → 跳转目标页
    if (to.meta.guestOnly && userStore.isLoggedIn) {
      return resolveAuthRedirect(to.query.redirect)
    }

    return true
  })
}
