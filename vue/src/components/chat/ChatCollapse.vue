<script setup lang="ts">
import { ref, watch } from 'vue'
import ChatSegmentList from '@/components/chat/ChatSegmentList.vue'
import type { MessageSegment } from '@/utils/aiMarkdown'

const props = defineProps<{
  /** 折叠标题 */
  title: string
  /** true=评查进行中（Web 端显示 loading 图标） */
  loading: boolean
  /** 折叠体内片段（markdown + file 等） */
  bodySegments: MessageSegment[]
}>()

/** 展开状态：进行中默认展开，完成后默认收起（对齐 Web Collapse） */
const expanded = ref(props.loading)

watch(
  () => props.loading,
  (loading) => {
    expanded.value = loading
  },
)
</script>

<template>
  <div class="chat-collapse">
    <button type="button" class="collapse-header" @click="expanded = !expanded">
      <span class="collapse-icon" :class="{ loading: loading, done: !loading }">
        {{ loading ? '◌' : '✓' }}
      </span>
      <span class="collapse-title">{{ title }}</span>
      <span class="collapse-arrow">{{ expanded ? '▾' : '▸' }}</span>
    </button>
    <div v-show="expanded" class="collapse-body">
      <ChatSegmentList :segments="bodySegments" />
    </div>
  </div>
</template>

<style scoped>
.chat-collapse {
  margin: 8px 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: #fafcff;
}
.collapse-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: #f0f5ff;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
}
.collapse-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}
.collapse-icon.loading {
  color: var(--primary);
  animation: spin 1s linear infinite;
}
.collapse-icon.done {
  background: #f6ffed;
  color: var(--success);
}
.collapse-title {
  flex: 1;
  font-weight: 500;
}
.collapse-arrow {
  color: var(--text-secondary);
  font-size: 12px;
}
.collapse-body {
  padding: 8px 12px 12px 32px;
  overflow-x: auto;
  max-width: 100%;
}
.chat-collapse {
  max-width: 100%;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<style>
.chat-collapse .markdown-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
}
</style>
