<script setup lang="ts">
import { inject } from 'vue'
import ChatCollapse from '@/components/chat/ChatCollapse.vue'
import ChatFileCard from '@/components/chat/ChatFileCard.vue'
import { previewFromClickEvent } from '@/utils/aiMarkdown'
import type { MessageSegment } from '@/utils/aiMarkdown'
import type { PreviewData } from '@/types/chat'

defineProps<{
  segments: MessageSegment[]
}>()

/** 由 AiChatView 等父级 provide，点击链接打开 PDF 预览 */
const openPdfPreview = inject<((data: PreviewData) => void) | null>('openPdfPreview', null)

/** 点击 markdown 内 PDF 链接（扣分说明、文书目录等） */
function onContentClick(e: MouseEvent) {
  const data = previewFromClickEvent(e)
  if (data && openPdfPreview) {
    openPdfPreview(data)
  }
}
</script>

<template>
  <template v-for="seg in segments" :key="seg.key">
    <ChatCollapse
      v-if="seg.type === 'collapse'"
      :title="seg.title"
      :loading="seg.loading"
      :body-segments="seg.bodySegments"
    />
    <ChatFileCard
      v-else-if="seg.type === 'file'"
      :file-type="seg.fileType"
      :head="seg.head"
      :data="seg.data"
      :filename="seg.filename"
      :ready="seg.ready"
    />
    <div
      v-else
      class="markdown-content"
      v-html="seg.html"
      @click="onContentClick"
    />
  </template>
</template>

<style scoped>
.markdown-content {
  word-break: break-word;
  overflow-x: auto;
  max-width: 100%;
}
</style>

<style>
/* 表格横向滚动，避免撑开气泡宽度 */
.markdown-content table {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.markdown-content .md-preview-link {
  color: var(--primary);
  text-decoration: underline;
  cursor: pointer;
}
</style>
