<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { uploadChatFile } from '@/api/chat'
import { formatFileSize } from '@/utils/chatContent'
import type { ChatAttachment } from '@/types/chat'

/** 弹框显隐（v-model） */
const visible = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  /** 用户点击确定，返回已上传附件（对齐 Web PdfDialog submit） */
  submit: [files: ChatAttachment[]]
}>()

/** 与 Web PdfDialog 一致的上传限制 */
const MAX_COUNT = 10
const MAX_SIZE = 300 * 1024 * 1024
const ALLOW_EXT = ['jpg', 'jpeg', 'png', 'pdf']

/** 上传队列项 */
interface UploadItem {
  id: string
  name: string
  size: number
  status: 'uploading' | 'success' | 'error'
  /** 上传进度 0-100 */
  progress: number
  errorMsg?: string
  attachment?: ChatAttachment
}

const fileInputRef = ref<HTMLInputElement | null>(null)
const fileList = ref<UploadItem[]>([])
const dragOver = ref(false)
const toastMsg = ref('')

/** 是否有文件正在上传（确定按钮禁用，对齐 Web uploading/ready） */
const hasUploading = computed(() => fileList.value.some((f) => f.status === 'uploading'))

/** 已成功上传的文件 */
const successFiles = computed(() =>
  fileList.value.filter((f) => f.status === 'success' && f.attachment).map((f) => f.attachment!),
)

/** 按 id 更新列表项，确保 Vue 响应式刷新 */
function patchItem(id: string, patch: Partial<UploadItem>) {
  const idx = fileList.value.findIndex((f) => f.id === id)
  const current = fileList.value[idx]
  if (idx === -1 || !current) return
  fileList.value[idx] = { ...current, ...patch }
}

/** 关闭时清空列表 */
watch(visible, (v) => {
  if (!v) {
    fileList.value = []
    toastMsg.value = ''
  }
})

/** 校验文件格式与大小（对齐 Web before-upload） */
function validateFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOW_EXT.includes(ext)) return '请上传正确格式的文件！'
  if (file.size >= MAX_SIZE) return '上传文件大小不能超过 300MB!'
  return null
}

/** 判断 modal_type：PDF 为 file，其余为 image */
function resolveModalType(file: File): 'file' | 'image' {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return 'file'
  }
  return 'image'
}

/** 上传单个文件并更新进度 */
async function uploadOne(id: string, file: File) {
  try {
    const res = await uploadChatFile(file, (percent) => {
      patchItem(id, { progress: percent })
    })
    if (res.code !== 200 || !res.data?.file_url) {
      patchItem(id, { status: 'error', errorMsg: res.message || '上传失败' })
      return
    }
    const fileUrl = res.data.file_url
    patchItem(id, {
      status: 'success',
      progress: 100,
      attachment: {
        name: res.data.filename || file.name,
        size: file.size,
        url: fileUrl,
        download_url: fileUrl,
        modal_type: resolveModalType(file),
      },
    })
  } catch (err) {
    patchItem(id, {
      status: 'error',
      errorMsg: err instanceof Error ? err.message : '上传失败',
    })
  }
}

/** 处理选中的文件列表（选中即上传，对齐 Web el-upload） */
async function handleFiles(files: FileList | File[]) {
  const arr = Array.from(files)
  if (!arr.length) return

  const remain = MAX_COUNT - fileList.value.length
  if (remain <= 0) {
    toastMsg.value = `最多支持同时上传 ${MAX_COUNT} 份文件`
    return
  }

  for (const file of arr.slice(0, remain)) {
    const err = validateFile(file)
    if (err) {
      toastMsg.value = err
      continue
    }

    const id = `${Date.now()}-${Math.random()}`
    fileList.value.push({
      id,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 1,
    })
    await nextTick()
    await uploadOne(id, file)
  }
}

function onInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) handleFiles(input.files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
  if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files)
}

function removeItem(id: string) {
  fileList.value = fileList.value.filter((f) => f.id !== id)
}

function onCancel() {
  visible.value = false
}

/** 确定：将已上传文件交给父组件，后续由用户点击「发送」传给 AI */
function onConfirm() {
  if (hasUploading.value || successFiles.value.length === 0) return
  emit('submit', successFiles.value)
  visible.value = false
}
</script>

<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    round
    role="dialog"
    aria-labelledby="upload-title"
    :close-on-click-overlay="!hasUploading"
    :closeable="!hasUploading"
    class="upload-popup"
  >
    <div class="upload-dialog">
      <div class="dialog-header">
        <h3 id="upload-title" class="dialog-title">上传文件</h3>
        <p class="dialog-desc">支持 jpg/jpeg/png/pdf，最多 10 份，单文件不超过 300M</p>
      </div>

      <div class="dialog-body">
        <p v-if="toastMsg" class="toast-msg">{{ toastMsg }}</p>

        <!-- 拖拽上传区（对齐 Web case-upload） -->
        <div
          class="upload-zone"
          :class="{ 'is-dragover': dragOver }"
          @click="fileInputRef?.click()"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop="onDrop"
        >
          <input
            ref="fileInputRef"
            type="file"
            class="hidden-input"
            accept=".jpg,.jpeg,.png,.pdf"
            multiple
            @change="onInputChange"
          />
          <div class="upload-content">
            <div class="pdf-icon" aria-hidden="true">
              <svg viewBox="0 0 48 56">
                <path
                  fill="#E74C3C"
                  d="M8 0h22l18 18v36a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z"
                />
                <path fill="#C0392B" d="M30 0l18 18H32a2 2 0 0 1-2-2V0z" />
                <text x="24" y="42" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">
                  PDF
                </text>
              </svg>
            </div>
            <p class="upload-text-main">点击或拖拽案卷到此处上传</p>
          </div>
        </div>

        <!-- 已选文件列表 -->
        <ul v-if="fileList.length" class="file-list">
          <li v-for="item in fileList" :key="item.id" class="file-item" :class="item.status">
            <div class="file-main">
              <span v-if="item.status === 'uploading'" class="spinner" aria-hidden="true" />
              <span class="file-name">{{ item.name }}</span>
              <span class="file-meta">
                <template v-if="item.status === 'uploading'">{{ item.progress }}%</template>
                <template v-else-if="item.status === 'error'">{{ item.errorMsg }}</template>
                <template v-else>{{ formatFileSize(item.size) }} ✓</template>
              </span>
              <button
                v-if="item.status !== 'uploading'"
                type="button"
                class="file-remove"
                aria-label="移除"
                @click.stop="removeItem(item.id)"
              >
                <van-icon name="cross" />
              </button>
            </div>
            <div v-if="item.status === 'uploading'" class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: Math.max(item.progress, 2) + '%' }"
              />
            </div>
          </li>
        </ul>
      </div>

      <div class="dialog-footer">
        <p class="footer-hint">上传完成后点击「确定」，再在输入框点击「发送」开始 AI 分析</p>
        <div class="footer-actions">
          <van-button block round plain type="primary" @click="onCancel">取消</van-button>
          <van-button
            block
            round
            type="primary"
            :disabled="hasUploading || successFiles.length === 0"
            @click="onConfirm"
          >
            确定
          </van-button>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<style scoped>
/** 底部弹层：高度随视口缩放，对齐 CaseUploadSheet */
.upload-popup {
  max-height: min(88dvh, 88vh);
}

.upload-dialog {
  display: flex;
  flex-direction: column;
  max-height: min(88dvh, 88vh);
}

.dialog-header {
  padding: var(--space-3) var(--page-margin-x) var(--space-2);
  padding-right: calc(var(--page-margin-x) + var(--touch-min));
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.dialog-title {
  margin: 0;
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text);
}

.dialog-desc {
  margin: var(--space-1) 0 0;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.dialog-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-3) var(--page-margin-x);
}

.toast-msg {
  margin: 0 0 var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: #fff7e6;
  color: #d48806;
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
}

.upload-zone {
  border: 1px dashed #b3d4ff;
  border-radius: var(--radius-md);
  background: #fafcff;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.upload-zone.is-dragover {
  border-color: var(--primary);
  background: #e6f4ff;
}

.upload-content {
  padding: var(--space-4) var(--page-margin-x);
  text-align: center;
}

.pdf-icon {
  margin-bottom: var(--space-2);
  display: flex;
  justify-content: center;
}

.pdf-icon svg {
  width: clamp(32px, 10vw, 40px);
  height: auto;
}

.upload-text-main {
  margin: 0;
  font-size: var(--font-md);
  color: var(--text);
}

.hidden-input {
  display: none;
}

.file-list {
  list-style: none;
  margin: var(--space-3) 0 0;
  padding: 0;
  max-height: clamp(120px, 28dvh, 200px);
  overflow-y: auto;
}

.file-item {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: #f5f8ff;
  margin-bottom: var(--space-2);
  font-size: var(--font-sm);
}

.file-item.error {
  background: #fff1f0;
  color: var(--danger);
}

.file-main {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--touch-min);
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  flex-shrink: 0;
  font-size: var(--font-xs);
  color: var(--text-secondary);
  min-width: clamp(40px, 12vw, 48px);
  text-align: right;
}

.file-item.error .file-meta {
  color: var(--danger);
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
  flex-shrink: 0;
}

.progress-track {
  margin-top: var(--space-2);
  height: var(--space-1);
  background: #dce8f8;
  border-radius: var(--space-1);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #69b1ff);
  border-radius: inherit;
  transition: width 0.15s linear;
  min-width: 2%;
}

.spinner {
  width: var(--space-3);
  height: var(--space-3);
  border: 2px solid #dce8f8;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.dialog-footer {
  padding: var(--space-3) var(--page-margin-x) calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.footer-hint {
  margin: 0 0 var(--space-2);
  font-size: var(--font-xs);
  color: var(--text-secondary);
  line-height: 1.5;
}

.footer-actions {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: var(--space-2);
}

.footer-actions :deep(.van-button) {
  min-height: var(--touch-min);
  font-size: var(--font-md);
}
</style>
