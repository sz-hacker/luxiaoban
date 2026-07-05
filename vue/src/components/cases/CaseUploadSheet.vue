<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import {
  checkCaseHash,
  parseCaseFileStream,
  uploadCasePdf,
  type CaseParseFileInfo,
} from '@/api/caseReview'
import { sha256Hex } from '@/utils/case'

/** 弹层显隐 */
const visible = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  /** 全部文件解析完成 */
  success: []
}>()

/** 与 Web CaseDialog 一致的上传限制 */
const MAX_COUNT = 10
const MAX_SIZE_MB = 300

/** 解析步骤状态 */
type StepStatus = 'pending' | 'processing' | 'completed' | 'fail'

/** 队列中的单个案卷 */
interface CaseUploadItem {
  id: string
  file: File
  hash: string
  uploadProgress: number
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error'
  uploadError?: string
  parseStatus: 'pending' | 'processing' | 'completed' | 'fail'
  ocr: StepStatus
  struct: StepStatus
  keywords: StepStatus
  errorTitle?: string
}

const fileInputRef = ref<HTMLInputElement | null>(null)
const items = ref<CaseUploadItem[]>([])
const processing = ref(false)
const abortRef = ref<AbortController | null>(null)

/** 是否正在上传或解析 */
const isBusy = computed(() => processing.value || items.value.some((i) => i.uploadStatus === 'uploading'))

/** 全部文件是否处理完毕（成功或失败） */
const allFinished = computed(
  () =>
    items.value.length > 0 &&
    items.value.every(
      (i) =>
        i.uploadStatus === 'error' ||
        i.parseStatus === 'completed' ||
        i.parseStatus === 'fail',
    ),
)

/** 是否有至少一个解析成功 */
const hasSuccess = computed(() => items.value.some((i) => i.parseStatus === 'completed'))

/** 按 id 更新队列项 */
function patchItem(id: string, patch: Partial<CaseUploadItem>) {
  const idx = items.value.findIndex((i) => i.id === id)
  const current = items.value[idx]
  if (idx === -1 || !current) return
  items.value[idx] = { ...current, ...patch }
}

/** 关闭时重置状态 */
watch(visible, (v) => {
  if (!v) {
    abortRef.value?.abort()
    abortRef.value = null
    items.value = []
    processing.value = false
  }
})

/** 校验 PDF 格式与大小 */
function validatePdf(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext !== 'pdf') return '请上传 PDF 格式的案卷文件'
  if (file.size >= MAX_SIZE_MB * 1024 * 1024) return `单文件大小不能超过 ${MAX_SIZE_MB}MB`
  return null
}

/** 创建队列项 */
function createItem(file: File, hash: string): CaseUploadItem {
  return {
    id: `${Date.now()}-${Math.random()}`,
    file,
    hash,
    uploadProgress: 0,
    uploadStatus: 'pending',
    parseStatus: 'pending',
    ocr: 'pending',
    struct: 'pending',
    keywords: 'pending',
  }
}

/** 处理用户选中的多个 PDF */
async function handleFiles(files: FileList | File[]) {
  const arr = Array.from(files)
  if (!arr.length) return

  const remain = MAX_COUNT - items.value.length
  if (remain <= 0) {
    showToast(`最多同时上传 ${MAX_COUNT} 份案卷`)
    return
  }

  const nextItems: CaseUploadItem[] = []
  for (const file of arr.slice(0, remain)) {
    const err = validatePdf(file)
    if (err) {
      showToast(err)
      continue
    }
    const hash = await sha256Hex(file)
    const check = await checkCaseHash(hash)
    if (check.code !== 200) {
      showToast(check.message || '文件校验失败')
      continue
    }
    if (check.data?.exists) {
      showToast(`「${file.name}」已存在，请勿重复上传`)
      continue
    }
    nextItems.push(createItem(file, hash))
  }

  if (!nextItems.length) return
  items.value = [...items.value, ...nextItems]
}

function onInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) handleFiles(input.files)
  input.value = ''
}

function removeItem(id: string) {
  if (isBusy.value) return
  items.value = items.value.filter((i) => i.id !== id)
}

/** 更新 SSE 解析进度到对应步骤 */
function applyParseProgress(item: CaseUploadItem, step: 'ocr' | 'struct' | 'keywords', status: string, title?: string) {
  const stepPatch: Partial<CaseUploadItem> = {}
  if (status === 'finished') {
    stepPatch[step] = 'completed'
  } else if (status === 'fail') {
    stepPatch[step] = 'fail'
    stepPatch.errorTitle = title
  } else {
    stepPatch[step] = 'processing'
  }
  patchItem(item.id, stepPatch)
}

/** 上传并解析单个案卷 */
async function processOne(item: CaseUploadItem, signal: AbortSignal) {
  patchItem(item.id, { uploadStatus: 'uploading', uploadProgress: 1 })

  let fileUrl = ''
  try {
    const up = await uploadCasePdf(item.file, (percent) => {
      patchItem(item.id, { uploadProgress: percent })
    })
    if (up.code !== 200 || !up.data?.file_url) {
      throw new Error(up.message || '上传失败')
    }
    fileUrl = up.data.file_url
    patchItem(item.id, { uploadStatus: 'success', uploadProgress: 100 })
  } catch (err) {
    patchItem(item.id, {
      uploadStatus: 'error',
      uploadError: err instanceof Error ? err.message : '上传失败',
    })
    return
  }

  patchItem(item.id, {
    parseStatus: 'processing',
    ocr: 'processing',
    struct: 'pending',
    keywords: 'pending',
  })

  const fileInfo: CaseParseFileInfo = {
    filename: item.file.name,
    url: fileUrl,
    size: item.file.size,
    modal_type: 'file',
    download_url: fileUrl,
    hash: item.hash,
  }

  try {
    await parseCaseFileStream(
      fileInfo,
      ({ step, status, title }) => {
        applyParseProgress(item, step, status, title)
      },
      signal,
    )
    patchItem(item.id, { parseStatus: 'completed' })
  } catch (err) {
    if (signal.aborted) return
    patchItem(item.id, { parseStatus: 'fail', errorTitle: err instanceof Error ? err.message : '解析失败' })
  }
}

/** 开始上传并解析全部队列 */
async function startUpload() {
  if (items.value.length === 0 || isBusy.value) return
  processing.value = true
  abortRef.value = new AbortController()
  const signal = abortRef.value.signal

  for (const item of items.value) {
    if (signal.aborted) break
    if (item.uploadStatus === 'success' && item.parseStatus === 'completed') continue
    await processOne(item, signal)
  }

  processing.value = false
}

function onCancel() {
  if (isBusy.value) return
  visible.value = false
}

/** 确认完成并通知父组件刷新列表 */
function onConfirm() {
  if (hasSuccess.value) emit('success')
  visible.value = false
}

/** 步骤状态文案 */
function stepLabel(status: StepStatus) {
  if (status === 'completed') return '完成'
  if (status === 'processing') return '进行中'
  if (status === 'fail') return '失败'
  return '等待'
}
</script>

<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    round
    :close-on-click-overlay="!isBusy"
    :closeable="!isBusy"
    class="case-upload-popup"
  >
    <div class="sheet">
      <div class="sheet-header">
        <h3 class="sheet-title">上传 PDF 案卷</h3>
        <p class="sheet-desc">支持多份 PDF，上传后 AI 自动提取关键信息与文书目录</p>
      </div>

      <div class="sheet-body">
        <button
          type="button"
          class="pick-btn"
          :disabled="isBusy || items.length >= MAX_COUNT"
          @click="fileInputRef?.click()"
        >
          <van-icon name="plus" />
          <span>选择 PDF 文件（最多 {{ MAX_COUNT }} 份）</span>
        </button>
        <input
          ref="fileInputRef"
          type="file"
          class="hidden-input"
          accept=".pdf,application/pdf"
          multiple
          @change="onInputChange"
        />

        <ul v-if="items.length" class="file-list">
          <li v-for="item in items" :key="item.id" class="file-item">
            <div class="file-head">
              <span class="file-name">{{ item.file.name }}</span>
              <button
                v-if="!isBusy"
                type="button"
                class="file-remove"
                aria-label="移除"
                @click="removeItem(item.id)"
              >
                <van-icon name="cross" />
              </button>
            </div>

            <div v-if="item.uploadStatus === 'uploading'" class="progress-row">
              <van-progress :percentage="item.uploadProgress" stroke-width="4" />
              <span class="progress-text">上传 {{ item.uploadProgress }}%</span>
            </div>
            <p v-else-if="item.uploadStatus === 'error'" class="error-text">{{ item.uploadError }}</p>

            <div v-if="item.parseStatus !== 'pending'" class="parse-steps">
              <span :class="['step', item.ocr]">OCR {{ stepLabel(item.ocr) }}</span>
              <span :class="['step', item.struct]">结构 {{ stepLabel(item.struct) }}</span>
              <span :class="['step', item.keywords]">关键词 {{ stepLabel(item.keywords) }}</span>
            </div>
            <p v-if="item.errorTitle" class="error-text">{{ item.errorTitle }}</p>
          </li>
        </ul>
      </div>

      <div class="sheet-footer">
        <template v-if="isBusy">
          <p class="footer-tip">文件解析中，请稍候…</p>
        </template>
        <template v-else-if="allFinished">
          <van-button block round type="primary" @click="onConfirm">确认</van-button>
        </template>
        <template v-else>
          <div class="footer-actions">
            <van-button block round plain type="primary" @click="onCancel">取消</van-button>
            <van-button block round type="primary" :disabled="items.length === 0" @click="startUpload">
              上传并解析
            </van-button>
          </div>
        </template>
      </div>
    </div>
  </van-popup>
</template>

<style scoped>
.case-upload-popup {
  max-height: 88vh;
}

.sheet {
  display: flex;
  flex-direction: column;
  max-height: 88vh;
}

.sheet-header {
  padding: var(--space-3) var(--page-margin-x) var(--space-2);
  border-bottom: 1px solid var(--border);
}

.sheet-title {
  margin: 0;
  font-size: var(--font-lg);
  font-weight: 600;
}

.sheet-desc {
  margin: var(--space-1) 0 0;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.sheet-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-3) var(--page-margin-x);
}

.pick-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  min-height: var(--touch-min);
  border: 1px dashed var(--primary);
  border-radius: var(--radius-md);
  background: #f5f9ff;
  color: var(--primary);
  font-size: var(--font-md);
}

.pick-btn:disabled {
  opacity: 0.5;
}

.hidden-input {
  display: none;
}

.file-list {
  list-style: none;
  margin: var(--space-3) 0 0;
  padding: 0;
}

.file-item {
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  box-shadow: var(--shadow);
}

.file-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.file-name {
  flex: 1;
  font-size: var(--font-sm);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-min);
  height: var(--touch-min);
  margin: calc(-1 * var(--space-2));
  border: none;
  background: transparent;
  color: var(--text-secondary);
}

.progress-row {
  margin-top: var(--space-2);
}

.progress-text {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--font-xs);
  color: var(--text-secondary);
}

.parse-steps {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.step {
  font-size: var(--font-xs);
  padding: 2px var(--space-2);
  border-radius: 999px;
  background: var(--van-gray-2);
  color: var(--text-secondary);
}

.step.processing {
  background: #e6f4ff;
  color: var(--primary);
}

.step.completed {
  background: #f6ffed;
  color: var(--success);
}

.step.fail {
  background: #fff1f0;
  color: var(--danger);
}

.error-text {
  margin: var(--space-1) 0 0;
  font-size: var(--font-xs);
  color: var(--danger);
}

.sheet-footer {
  padding: var(--space-3) var(--page-margin-x) calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--border);
}

.footer-tip {
  margin: 0;
  text-align: center;
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.footer-actions {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: var(--space-2);
}
</style>
