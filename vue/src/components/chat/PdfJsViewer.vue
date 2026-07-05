<script setup lang="ts">
import { ref, shallowRef, watch, onUnmounted, nextTick } from 'vue'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { acquirePdfDocument } from '@/utils/pdfViewer'

const props = defineProps<{
  /** PDF 文件地址 */
  pdfUrl: string
  /** 当前页码（1-based） */
  pageNum: number
  /** 是否激活加载（面板打开时为 true） */
  active: boolean
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWrapRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const error = ref('')
const totalPages = ref(0)
/** 当前展示页码 */
const currentPage = ref(1)
/** pdf.js 文档实例（来自全局缓存，组件卸载时不 destroy） */
const pdfDoc = shallowRef<PDFDocumentProxy | null>(null)

/** 进行中的渲染任务，切换页面前需 cancel */
let renderTask: { cancel: () => void; promise: Promise<void> } | null = null
/** 容器尺寸监听（弹层动画结束后宽度才稳定） */
let resizeObserver: ResizeObserver | null = null
/** 避免 resize 连续触发重复渲染 */
let renderScheduled = false

/** 取消渲染并释放本地引用（不销毁缓存中的 PDF 文档） */
function resetLocal() {
  renderTask?.cancel()
  renderTask = null
  pdfDoc.value = null
  totalPages.value = 0
  error.value = ''
}

/** 将页码限制在有效范围 */
function clampPage(page: number, max: number): number {
  if (max <= 0) return 1
  return Math.min(Math.max(page, 1), max)
}

/** 等待 canvas 挂载且容器宽度可用 */
async function waitForCanvasReady(): Promise<HTMLCanvasElement | null> {
  for (let i = 0; i < 8; i++) {
    await nextTick()
    const canvas = canvasRef.value
    const width = canvas?.parentElement?.clientWidth ?? 0
    if (canvas && width > 0) return canvas
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
  }
  return canvasRef.value
}

/** 渲染指定页到 canvas（按容器宽度缩放） */
async function renderPage(pageNumber: number) {
  const doc = pdfDoc.value
  const canvas = await waitForCanvasReady()
  if (!doc || !canvas) return

  renderTask?.cancel()

  try {
    const page = await doc.getPage(pageNumber)
    const baseViewport = page.getViewport({ scale: 1 })
    const containerWidth = canvas.parentElement?.clientWidth ?? baseViewport.width
    const scale = Math.max(containerWidth, 1) / baseViewport.width
    const viewport = page.getViewport({ scale })

    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = viewport.width
    canvas.height = viewport.height

    const task = page.render({ canvasContext: context, viewport })
    renderTask = task
    await task.promise
  } catch (e) {
    if (e instanceof Error && e.name === 'RenderingCancelledException') return
    throw e
  } finally {
    renderTask = null
  }
}

/** 调度一次重绘（容器尺寸变化时） */
function scheduleRender() {
  if (!pdfDoc.value || renderScheduled) return
  renderScheduled = true
  requestAnimationFrame(() => {
    renderScheduled = false
    if (pdfDoc.value) void renderPage(currentPage.value)
  })
}

/** 监听 canvas 容器宽度变化 */
function bindResizeObserver() {
  resizeObserver?.disconnect()
  const el = canvasWrapRef.value
  if (!el) return
  resizeObserver = new ResizeObserver(() => scheduleRender())
  resizeObserver.observe(el)
}

/** 加载 PDF（优先命中缓存）并渲染目标页 */
async function loadDocument() {
  if (!props.active || !props.pdfUrl) return

  loading.value = true
  error.value = ''
  resetLocal()

  try {
    const doc = await acquirePdfDocument(props.pdfUrl)
    if (!props.active) return

    pdfDoc.value = doc
    totalPages.value = doc.numPages
    currentPage.value = clampPage(props.pageNum, doc.numPages)

    loading.value = false
    await nextTick()
    bindResizeObserver()
    await renderPage(currentPage.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'PDF 加载失败'
    loading.value = false
  }
}

/** 上一页（仅重绘，不重新下载 PDF） */
function goPrev() {
  if (currentPage.value <= 1) return
  currentPage.value -= 1
  void renderPage(currentPage.value)
}

/** 下一页（仅重绘，不重新下载 PDF） */
function goNext() {
  if (currentPage.value >= totalPages.value) return
  currentPage.value += 1
  void renderPage(currentPage.value)
}

watch(
  () => props.active,
  (active) => {
    if (active) void loadDocument()
    else {
      resizeObserver?.disconnect()
      resizeObserver = null
      resetLocal()
    }
  },
  { immediate: true },
)

watch(
  () => props.pdfUrl,
  (url, prev) => {
    if (url !== prev && props.active) void loadDocument()
  },
)

/** 外部定位页码（链接跳转，仅换页不重载文档） */
watch(
  () => props.pageNum,
  (page) => {
    if (!pdfDoc.value || !props.active) return
    const next = clampPage(page, totalPages.value)
    if (next === currentPage.value) return
    currentPage.value = next
    void renderPage(next)
  },
)

onUnmounted(() => {
  resizeObserver?.disconnect()
  resetLocal()
})
</script>

<template>
  <div class="pdf-js-viewer">
    <div v-if="error" class="viewer-state error">{{ error }}</div>
    <template v-else>
      <div v-if="pdfDoc" class="page-toolbar">
        <button type="button" class="page-btn" :disabled="currentPage <= 1" @click="goPrev">
          上一页
        </button>
        <span class="page-indicator">{{ currentPage }} / {{ totalPages }}</span>
        <button
          type="button"
          class="page-btn"
          :disabled="currentPage >= totalPages"
          @click="goNext"
        >
          下一页
        </button>
      </div>
      <div ref="canvasWrapRef" class="canvas-wrap">
        <div v-if="loading" class="viewer-state loading-overlay">PDF 加载中…</div>
        <canvas v-show="pdfDoc && !loading" ref="canvasRef" class="pdf-canvas" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.pdf-js-viewer {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.viewer-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-secondary);
  padding: var(--space-4);
  text-align: center;
}

.viewer-state.error {
  color: var(--danger);
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(245, 245, 245, 0.92);
  z-index: 1;
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-bottom: 1px solid var(--border);
  background: #fff;
  flex-shrink: 0;
}

.page-btn {
  min-height: 32px;
  padding: 0 var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: #fff;
  font-size: 13px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 72px;
  text-align: center;
}

.canvas-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-2);
  -webkit-overflow-scrolling: touch;
}

.pdf-canvas {
  display: block;
  width: 100%;
  height: auto;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
}
</style>
