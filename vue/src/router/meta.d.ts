import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 需要登录 */
    requiresAuth?: boolean
    /** 仅未登录可访问（如登录页） */
    guestOnly?: boolean
    /** 隐藏底部 Tab 栏 */
    hideTabBar?: boolean
  }
}
