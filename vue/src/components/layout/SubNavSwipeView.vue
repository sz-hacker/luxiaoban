<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import type { SubNavTabItem } from '@/components/layout/SubNavTabs.vue'
import { useHorizontalSwipe } from '@/composables/useHorizontalSwipe'
import { subNavTransitionName, setSubNavTransition } from '@/composables/useSubNavTransition'
import { getSubNavIndex } from '@/config/sub-nav'

const props = defineProps<{
  items: SubNavTabItem[]
}>()

const route = useRoute()
const router = useRouter()

/** 当前激活的子 Tab 索引 */
const currentIndex = computed(() => getSubNavIndex(route.path, props.items))

/** 切换到指定索引的子 Tab */
function goToIndex(index: number) {
  const item = props.items[index]
  if (!item || index === currentIndex.value) return
  setSubNavTransition(currentIndex.value, index)
  router.push(item.path)
}

/** 左右滑切换相邻 Tab（方向与点击 Tab 一致） */
const swipe = useHorizontalSwipe({
  onSwipeLeft: () => {
    if (currentIndex.value < props.items.length - 1) {
      goToIndex(currentIndex.value + 1)
    }
  },
  onSwipeRight: () => {
    if (currentIndex.value > 0) {
      goToIndex(currentIndex.value - 1)
    }
  },
})
</script>

<template>
  <div
    class="sub-nav-swipe-view"
    @touchstart.passive="swipe.onTouchStart"
    @touchmove.passive="swipe.onTouchMove"
    @touchend="swipe.onTouchEnd"
  >
    <RouterView v-slot="{ Component }">
      <Transition :name="subNavTransitionName">
        <component :is="Component" :key="route.path" class="sub-nav-page" />
      </Transition>
    </RouterView>
  </div>
</template>

<style scoped>
.sub-nav-swipe-view {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  touch-action: pan-y;
}

.sub-nav-page {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 向右切 Tab（点左侧 Tab）：旧页右出，新页从左进 */
.sub-nav-swipe-view :deep(.slide-right-enter-active),
.sub-nav-swipe-view :deep(.slide-right-leave-active),
.sub-nav-swipe-view :deep(.slide-left-enter-active),
.sub-nav-swipe-view :deep(.slide-left-leave-active) {
  transition: transform var(--transition-duration) cubic-bezier(0.25, 0.8, 0.25, 1);
}

.sub-nav-swipe-view :deep(.slide-right-leave-active),
.sub-nav-swipe-view :deep(.slide-left-leave-active) {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 1;
}

.sub-nav-swipe-view :deep(.slide-right-enter-active),
.sub-nav-swipe-view :deep(.slide-left-enter-active) {
  position: relative;
  z-index: 2;
}

/* 向左切 Tab（点右侧 Tab）：旧页左出，新页从右进 */
.sub-nav-swipe-view :deep(.slide-left-enter-from) {
  transform: translateX(100%);
}

.sub-nav-swipe-view :deep(.slide-left-leave-to) {
  transform: translateX(-100%);
}

.sub-nav-swipe-view :deep(.slide-right-enter-from) {
  transform: translateX(-100%);
}

.sub-nav-swipe-view :deep(.slide-right-leave-to) {
  transform: translateX(100%);
}
</style>
