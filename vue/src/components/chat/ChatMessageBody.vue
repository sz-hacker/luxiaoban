<script setup lang="ts">
import { computed } from 'vue'
import ChatSegmentList from '@/components/chat/ChatSegmentList.vue'
import { parseAiMessageContent } from '@/utils/aiMarkdown'

const props = defineProps<{
  content: string
  rawContent?: string
}>()

/** 解析后的消息片段（对齐 Web AIMessage.items） */
const segments = computed(() => parseAiMessageContent(props.rawContent || props.content))
</script>

<template>
  <div class="message-body">
    <ChatSegmentList :segments="segments" />
  </div>
</template>

<style scoped>
.message-body {
  word-break: break-word;
  max-width: 100%;
  overflow-x: auto;
}
</style>

<style>
/* 对齐 Web .markdown_content 基础样式 */
.message-body .markdown-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
}
.message-body .markdown-content p {
  margin: 0 0 8px;
}
.message-body .markdown-content ul,
.message-body .markdown-content ol {
  margin: 0 0 8px;
  padding-left: 20px;
}
.message-body .markdown-content h1,
.message-body .markdown-content h2,
.message-body .markdown-content h3 {
  margin: 12px 0 8px;
  font-size: 15px;
  font-weight: 600;
}
.message-body .markdown-content code {
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 13px;
}
.message-body .markdown-content pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}
.message-body .markdown-content pre code {
  background: none;
  padding: 0;
}
.message-body .markdown-content .md-preview-link,
.message-body .markdown-content a {
  color: var(--primary);
  text-decoration: underline;
  cursor: pointer;
}
.message-body .markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 13px;
}
.message-body .markdown-content th,
.message-body .markdown-content td {
  border: 1px solid var(--border);
  padding: 6px 8px;
}
</style>
