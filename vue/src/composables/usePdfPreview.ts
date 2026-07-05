import { ref } from 'vue'
import type { PreviewData } from '@/types/chat'

/**
 * PDF 预览状态（多页面复用：AI 对话、评查流程等）
 * @returns 显隐、预览参数及打开/关闭方法
 */
export function usePdfPreview() {
  const showPdfPreview = ref(false)
  const pdfPreview = ref<PreviewData | null>(null)

  /** 打开预览并定位到指定页码 */
  function openPdfPreview(data: PreviewData) {
    pdfPreview.value = { pdfUrl: data.pdfUrl, pageNum: data.pageNum }
    showPdfPreview.value = true
  }

  /** 关闭预览面板 */
  function closePdfPreview() {
    showPdfPreview.value = false
  }

  return {
    showPdfPreview,
    pdfPreview,
    openPdfPreview,
    closePdfPreview,
  }
}
