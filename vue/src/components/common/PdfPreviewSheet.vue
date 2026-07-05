<script setup lang="ts">
import { ref, watch } from 'vue'
import PdfJsViewer from '@/components/chat/PdfJsViewer.vue'
import type { PreviewData } from '@/types/chat'

/** 面板显隐（v-model:show） */
const show = defineModel<boolean>('show', { default: false })

const props = withDefaults(
  defineProps<{
    /** PDF 地址与页码 */
    preview: PreviewData | null
    /** 面板高度 */
    height?: string
  }>(),
  { height: '72vh' },
)

/** 是否激活加载 */
const viewerActive = ref(false)

watch(show, (visible) => {
  viewerActive.value = visible
})

/** 下载原文件 */
function onDownload() {
  if (!props.preview?.pdfUrl) return
  window.open(props.preview.pdfUrl, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <van-popup
    v-model:show="show"
    position="bottom"
    round
    safe-area-inset-bottom
    :style="{ height }"
    class="pdf-preview-popup"
  >
    <div class="pdf-preview-sheet">
      <van-nav-bar
        :title="preview ? `PDF 预览 · 第 ${preview.pageNum} 页` : 'PDF 预览'"
        left-arrow
        @click-left="show = false"
      >
        <template #right>
          <van-button v-if="preview?.pdfUrl" size="mini" plain type="primary" @click="onDownload">
            下载
          </van-button>
        </template>
      </van-nav-bar>

      <PdfJsViewer
        v-if="preview"
        :pdf-url="preview.pdfUrl"
        :page-num="preview.pageNum"
        :active="viewerActive && show"
      />
      <van-empty v-else description="暂无 PDF" />
    </div>
  </van-popup>
</template>

<style scoped>
.pdf-preview-sheet {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  overflow: hidden;
}
.pdf-preview-sheet :deep(.pdf-js-viewer) {
  flex: 1;
  min-height: 0;
}
</style>
