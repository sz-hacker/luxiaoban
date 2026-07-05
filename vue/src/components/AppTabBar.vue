<script setup lang="ts">
import { TAB_ITEMS } from '@/config/tabs'
</script>

<template>
  <van-tabbar route placeholder safe-area-inset-bottom>
    <van-tabbar-item
      v-for="tab in TAB_ITEMS"
      :key="tab.path"
      :to="tab.path"
      :icon="tab.icon"
    >
      {{ tab.label }}
    </van-tabbar-item>
  </van-tabbar>
</template>
