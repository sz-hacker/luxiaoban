<script setup lang="ts">
import { computed } from 'vue'
import type { ExcelColumnHead } from '@/utils/excelExport'
import { downloadExcelFromTableData } from '@/utils/excelExport'

const props = defineProps<{
  /** 文件类型：xlsx / xls / file */
  fileType: string
  /** 列头定义 */
  head?: ExcelColumnHead[]
  /** 表格行数据 */
  data?: Record<string, unknown>[]
  /** 显示/下载文件名（不含后缀） */
  filename?: string
  /** 数据是否已就绪（流式输出未完成时为 false） */
  ready?: boolean
}>()

/** 展示用文件名 */
const displayName = computed(() => {
  if (props.filename) {
    const name = props.filename
    return name.length > 24 ? `${name.slice(0, 21)}...` : name
  }
  const type = props.fileType?.toLowerCase()
  if (type === 'xlsx' || type === 'xls') return 'Excel 表格'
  return '文件'
})

/** 下载用完整文件名 */
const downloadName = computed(() => {
  if (props.filename) return props.filename.replace(/\.xlsx$/i, '')
  const type = props.fileType?.toLowerCase()
  if (type === 'xlsx' || type === 'xls') return '合规性评查结果列表'
  return `file_${Date.now()}`
})

/** 是否可下载（xlsx 且 head/data 齐全） */
const canDownload = computed(() => {
  const type = props.fileType?.toLowerCase()
  const isExcel = type === 'xlsx' || type === 'xls'
  return isExcel && props.ready !== false && !!props.head?.length && !!props.data?.length
})

/** 点击下载：将 head/data 生成为 xlsx */
function onDownload() {
  if (!canDownload.value || !props.head || !props.data) return
  try {
    downloadExcelFromTableData(props.head, props.data, downloadName.value)
  } catch (err) {
    console.error('Excel 下载失败:', err)
  }
}
</script>

<template>
  <div class="chat-file-card">
    <div class="file-icon">📊</div>
    <div class="file-info">
      <div class="file-name" :title="filename || displayName">{{ displayName }}</div>
      <div v-if="!canDownload" class="file-hint">数据生成中...</div>
    </div>
    <button
      type="button"
      class="download-btn"
      :disabled="!canDownload"
      @click="onDownload"
    >
      下载
    </button>
  </div>
</template>

<style scoped>
.chat-file-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #f6ffed;
}
.file-icon {
  font-size: 24px;
  flex-shrink: 0;
}
.file-info {
  flex: 1;
  min-width: 0;
}
.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.download-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
.download-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}
</style>
