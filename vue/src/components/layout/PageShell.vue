<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'

defineProps<{
  /** 页面标题；不传则不显示顶部标题栏 */
  title?: string
  showBack?: boolean
  /** 子区域内部滚动（任务列表等），外层 .page 不再滚动 */
  innerScroll?: boolean
}>()
</script>

<template>
  <div
    class="page"
    :class="{ 'page--no-header': !title && !showBack, 'page--inner-scroll': innerScroll }"
  >
    <AppHeader v-if="title || showBack" :title="title ?? ''" :show-back="showBack">
      <template #right>
        <slot name="header-right" />
      </template>
    </AppHeader>
    <slot />
  </div>
</template>

<style scoped>
.page--no-header {
  --header-h: 0px;
}

.page--inner-scroll {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
