<script setup lang="ts">
import type { CaseDirectoryEntry } from '@/types/review'
import { formatDirectoryPages, getDirectoryFirstPage } from '@/utils/review'

defineProps<{
  visible: boolean
  items: CaseDirectoryEntry[]
  /** 当前 PDF 页码，用于高亮 */
  currentPage: number
}>()

const emit = defineEmits<{
  close: []
  select: [entry: CaseDirectoryEntry, page: number]
}>()

/** 点击目录项：由父级打开 PDF 预览并定位页码 */
function onSelect(entry: CaseDirectoryEntry) {
  emit('select', entry, getDirectoryFirstPage(entry))
}
</script>

<template>
  <Transition name="drawer">
    <div v-if="visible" class="directory-drawer-mask" @click.self="emit('close')">
      <aside class="directory-drawer">
        <header class="drawer-header">
          <h2 class="drawer-title">目录</h2>
          <button type="button" class="close-btn" aria-label="关闭" @click="emit('close')">✕</button>
        </header>
        <ul class="menu-list">
          <li
            v-for="(item, index) in items"
            :key="index"
            class="menu-item"
            :class="{ active: currentPage === getDirectoryFirstPage(item) }"
            @click="onSelect(item)"
          >
            <span class="menu-name" :title="item.title">{{ item.title }}</span>
            <span class="menu-pages">P{{ formatDirectoryPages(item.pages) }}</span>
          </li>
        </ul>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.directory-drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.35);
}

.directory-drawer {
  width: min(82vw, 320px);
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--header-h);
  padding: 0 var(--space-3);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.drawer-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  min-width: var(--touch-min);
  min-height: var(--touch-min);
  border: none;
  background: none;
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
}

.menu-list {
  list-style: none;
  margin: 0;
  padding: var(--space-2) 0;
  overflow-y: auto;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3);
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
}

.menu-item.active {
  background: #e6f4ff;
}

.menu-name {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  color: var(--text);
}

.menu-pages {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--primary);
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-enter-active .directory-drawer,
.drawer-leave-active .directory-drawer {
  transition: transform 0.25s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .directory-drawer,
.drawer-leave-to .directory-drawer {
  transform: translateX(-100%);
}
</style>
