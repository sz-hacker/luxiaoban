import { ref } from 'vue'
import router from '@/router'
import { getTabOrderIndex, getRouteOutletKey } from '@/config/tabs'
import {
  CASE_SUB_NAV_ITEMS,
  TASK_SUB_NAV_ITEMS,
  getSubNavIndex,
  isCaseSubNavPath,
  isTaskSubNavPath,
} from '@/config/sub-nav'
import { setSubNavTransition } from '@/composables/useSubNavTransition'

/** 路由切换动画名称 */
export type RouteTransitionName = 'slide-left' | 'slide-right' | 'fade' | 'slide-up'

/** 当前过渡动画（供 App.vue 使用） */
export const routeTransitionName = ref<RouteTransitionName>('fade')

/**
 * 注册路由切换动画
 * 底部 Tab 间左右滑；案卷/任务子 Tab 在布局内滑动；登录页上滑；其余淡入淡出
 */
export function setupRouteTransition() {
  router.beforeEach((to, from) => {
    if (to.path === from.path) return true

    const toTab = getTabOrderIndex(to.path)
    const fromTab = getTabOrderIndex(from.path)

    if (toTab !== undefined && fromTab !== undefined) {
      routeTransitionName.value = toTab > fromTab ? 'slide-left' : 'slide-right'
      return true
    }

    /* 案卷子 Tab：布局不卸载，仅内容区左右滑 */
    if (isCaseSubNavPath(to.path) && isCaseSubNavPath(from.path)) {
      setSubNavTransition(
        getSubNavIndex(from.path, CASE_SUB_NAV_ITEMS),
        getSubNavIndex(to.path, CASE_SUB_NAV_ITEMS),
      )
      routeTransitionName.value = 'fade'
      return true
    }

    /* 任务子 Tab：布局不卸载，仅内容区左右滑 */
    if (isTaskSubNavPath(to.path) && isTaskSubNavPath(from.path)) {
      setSubNavTransition(
        getSubNavIndex(from.path, TASK_SUB_NAV_ITEMS),
        getSubNavIndex(to.path, TASK_SUB_NAV_ITEMS),
      )
      routeTransitionName.value = 'fade'
      return true
    }

    if (to.path === '/login') {
      routeTransitionName.value = 'slide-up'
      return true
    }

    if (from.path === '/login') {
      routeTransitionName.value = 'fade'
      return true
    }

    /* 进入/离开评查流程页：右滑进入、左滑返回 */
    if (to.name === 'review-process') {
      routeTransitionName.value = 'slide-left'
      return true
    }
    if (from.name === 'review-process') {
      routeTransitionName.value = 'slide-right'
      return true
    }

    /* 同一模块 outlet key 不变时不做整页动画 */
    if (getRouteOutletKey(to.path) === getRouteOutletKey(from.path)) {
      routeTransitionName.value = 'fade'
      return true
    }

    routeTransitionName.value = 'fade'
    return true
  })
}
