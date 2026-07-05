<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { setSubNavTransition } from '@/composables/useSubNavTransition'
import { getSubNavIndex } from '@/config/sub-nav'

/** 顶部二级 Tab 项 */
export interface SubNavTabItem {
  path: string
  label: string
}

const props = defineProps<{
  items: SubNavTabItem[]
}>()

const route = useRoute()
const router = useRouter()

/** 当前激活 Tab 索引 */
const activeIndex = computed(() => getSubNavIndex(route.path, props.items))

/** 点击 Tab：设定动画方向后跳转 */
function onTabClick({ name }: { name: string | number }) {
  const index = Number(name)
  const item = props.items[index]
  if (!item || index === activeIndex.value) return
  setSubNavTransition(activeIndex.value, index)
  router.push(item.path)
}
</script>

<template>
  <van-tabs
    :active="activeIndex"
    class="sub-nav-tabs"
    color="#fff"
    title-active-color="#fff"
    title-inactive-color="rgba(255,255,255,0.72)"
    line-width="24px"
    line-height="3px"
    shrink
    @click-tab="onTabClick"
  >
    <van-tab v-for="(item, index) in items" :key="item.path" :title="item.label" :name="index" />
  </van-tabs>
</template>

<style scoped>
.sub-nav-tabs {
  flex-shrink: 0;
  background: var(--header-gradient);
  margin: calc(-1 * var(--page-margin-y)) 0 var(--space-3);
}

.sub-nav-tabs :deep(.van-tabs__nav) {
  background: transparent;
}

.sub-nav-tabs :deep(.van-tabs__line) {
  background: #fff;
  border-radius: 2px 2px 0 0;
}
</style>
