<script setup lang="ts">
defineProps<{
  title: string
  showBack?: boolean
}>()
</script>

<template>
  <van-nav-bar
    :title="title"
    :left-arrow="showBack"
    fixed
    placeholder
    safe-area-inset-top
    class="app-nav-bar"
    @click-left="showBack && $router.back()"
  >
    <template #right>
      <slot name="right" />
    </template>
  </van-nav-bar>
</template>

<style scoped>
.app-nav-bar {
  --van-nav-bar-background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  --van-nav-bar-title-text-color: #fff;
  --van-nav-bar-icon-color: #fff;
  --van-nav-bar-text-color: #fff;
}
</style>
