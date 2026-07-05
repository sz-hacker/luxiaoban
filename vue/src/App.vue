<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { ConfigProvider } from 'vant'
import AppTabBar from '@/components/AppTabBar.vue'
import { routeTransitionName } from '@/composables/useRouteTransition'
import { getRouteOutletKey } from '@/config/tabs'

const route = useRoute()

/** Vant 主题色与布局 token 联动，避免写死 px */
const themeVars = {
  primaryColor: '#1677ff',
  tabbarHeight: 'var(--tabbar-h)',
  navBarHeight: 'var(--header-h)',
}

/** 不显示底部 Tab 的页面（登录页或 meta.hideTabBar） */
const hideTabBar = computed(() => route.meta.hideTabBar === true)

/** 顶层 outlet key：子 Tab 切换时保持布局挂载 */
const outletKey = computed(() => getRouteOutletKey(route.path))
</script>

<template>
  <ConfigProvider :theme-vars="themeVars">
    <div class="app-shell">
      <main class="app-content">
        <RouterView v-slot="{ Component }">
          <Transition :name="routeTransitionName" mode="out-in">
            <div :key="outletKey" class="route-outlet">
              <!-- page-view 与页面根节点分离，避免 flex/overflow 冲突，高度随屏幕撑满 -->
              <div class="page-view">
                <component :is="Component" />
              </div>
            </div>
          </Transition>
        </RouterView>
      </main>
      <AppTabBar v-if="!hideTabBar" />
    </div>
  </ConfigProvider>
</template>
