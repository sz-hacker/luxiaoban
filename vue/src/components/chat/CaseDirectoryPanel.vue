<script setup lang="ts">
import type { DirectoryItem } from '@/types/chat'

defineProps<{
  items: DirectoryItem[]
}>()
</script>

<template>
  <div v-if="items.length" class="directory-panel">
    <div class="directory-header">文书目录</div>
    <ul class="directory-list">
      <li v-for="(item, i) in items" :key="i" class="directory-item">
        <span class="name">{{ item.title }}</span>
        <span class="pages">{{ item.pages }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.directory-panel {
  background: #fff;
  border-radius: var(--radius);
  margin: 0 12px 8px;
  box-shadow: var(--shadow);
  max-height: 160px;
  display: flex;
  flex-direction: column;
}
.directory-header {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.directory-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  overflow-y: auto;
}
.directory-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
}
.name {
  color: var(--text);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pages {
  color: var(--text-secondary);
  flex-shrink: 0;
  font-size: 12px;
}
</style>
