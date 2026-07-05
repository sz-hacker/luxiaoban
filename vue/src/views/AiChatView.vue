<script setup lang="ts">
import { ref, onMounted, nextTick, watch, provide } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import ChatMessageBody from '@/components/chat/ChatMessageBody.vue'
import CaseUploadDialog from '@/components/chat/CaseUploadDialog.vue'
import PdfPreviewSheet from '@/components/common/PdfPreviewSheet.vue'
import { usePdfPreview } from '@/composables/usePdfPreview'
import {
  getAgentDetail,
  getChatHistory,
  getChatMessages,
  generateQuestions,
  sendChatMessage,
} from '@/api/chat'
import { formatFileSize } from '@/utils/chatContent'
import type { AgentDetail, ChatAttachment, ChatMessage, ChatSession } from '@/types/chat'

const agent = ref<AgentDetail | null>(null)
const sessions = ref<ChatSession[]>([])
const messages = ref<ChatMessage[]>([])
const suggestions = ref<string[]>([])
const sessionId = ref<string | null>(null)
const inputText = ref('')
const loading = ref(false)
const streaming = ref(false)
const showHistory = ref(false)
const showUploadDialog = ref(false)
const messagesEl = ref<HTMLElement | null>(null)

/** 待发送附件（上传弹框确定后暂存，点击发送时传给 AI） */
const pendingFiles = ref<ChatAttachment[]>([])
/** 上传确定后的提示 */
const uploadTip = ref('')

/** PDF 预览（扣分说明、文书链接等，对齐 PC preview） */
const { showPdfPreview, pdfPreview, openPdfPreview } = usePdfPreview()
provide('openPdfPreview', openPdfPreview)

/** 滚动到底部 */
async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

/** 初始化 Agent 与推荐问题 */
async function initAgent() {
  const detailRes = await getAgentDetail()
  if (detailRes.code === 200) {
    agent.value = detailRes.data
    const qRes = await generateQuestions(
      detailRes.data.name,
      detailRes.data.description,
      detailRes.data.prompt,
    )
    if (qRes.code === 200) {
      suggestions.value = qRes.data.prologue_questions.map((q) => q.question)
    } else {
      suggestions.value = detailRes.data.opening_question || []
    }
  }
}

/** 加载历史会话 */
async function loadSessions() {
  const res = await getChatHistory()
  if (res.code === 200) sessions.value = res.data
}

/** 解析历史消息中的附件 */
function mapHistoryMessage(m: {
  role: string
  content: string
  created_at: string
  extra?: { modal_type: string; url: string; filename?: string; name?: string; size?: number }[]
}): ChatMessage {
  const files: ChatAttachment[] = (m.extra || []).map((e) => ({
    name: e.filename || e.name || '附件',
    size: e.size || 0,
    url: e.url,
    modal_type: e.modal_type === 'image' ? 'image' : 'file',
  }))
  return {
    role: m.role as 'user' | 'assistant',
    content: m.content,
    rawContent: m.content,
    created_at: m.created_at,
    files: files.length ? files : undefined,
  }
}

/** 加载指定会话消息 */
async function loadSession(sid: string) {
  sessionId.value = sid
  showHistory.value = false
  const res = await getChatMessages(agent.value?.code || 'RTUJOGjyMx4n', sid)
  if (res.code === 200) {
    messages.value = res.data.map(mapHistoryMessage)
    await scrollToBottom()
  }
}

/** 开启新对话 */
function startNewChat() {
  sessionId.value = null
  messages.value = []
  pendingFiles.value = []
  uploadTip.value = ''
  showHistory.value = false
}

/** 打开上传弹框（对齐 Web PdfDialog.show） */
function triggerUpload() {
  showUploadDialog.value = true
}

/** 弹框确定：仅追加待发送附件，不预览 PDF（移动端 iframe 会触发下载） */
function onUploadSubmit(files: ChatAttachment[]) {
  pendingFiles.value.push(...files)
  const first = files[0]
  uploadTip.value =
    files.length === 1 && first
      ? `已添加「${first.name}」，点击发送开始 AI 分析`
      : `已添加 ${files.length} 个文件，点击发送开始 AI 分析`
}

/** 移除待发送附件 */
function removePendingFile(index: number) {
  pendingFiles.value.splice(index, 1)
  if (pendingFiles.value.length === 0) uploadTip.value = ''
}

/** 发送消息（含附件） */
async function handleSend(text?: string) {
  const content = (text ?? inputText.value).trim()
  const hasFiles = pendingFiles.value.length > 0
  if ((!content && !hasFiles) || streaming.value) return

  const filesToSend = [...pendingFiles.value]
  inputText.value = ''
  pendingFiles.value = []
  uploadTip.value = ''

  messages.value.push({
    role: 'user',
    content: content || '请分析这份案卷',
    files: filesToSend.length ? filesToSend : undefined,
  })

  const assistantMsg: ChatMessage = {
    role: 'assistant',
    content: '',
    rawContent: '',
    streaming: true,
  }
  messages.value.push(assistantMsg)
  /** 助手消息在数组中的索引，用于流式更新触发 Vue 响应式 */
  const assistantIdx = messages.value.length - 1
  await scrollToBottom()

  streaming.value = true
  loading.value = true

  /** 待合并的 SSE 文本片段（rAF 批量刷新，减轻 marked 解析压力） */
  let pendingChunk = ''
  let flushRaf: number | null = null

  /** 将 pendingChunk 合并进助手消息并刷新 UI */
  const flushAssistantContent = () => {
    flushRaf = null
    if (!pendingChunk) return
    const delta = pendingChunk
    pendingChunk = ''
    const msg = messages.value[assistantIdx]
    if (!msg || msg.role !== 'assistant') return
    const next = (msg.rawContent || '') + delta
    messages.value[assistantIdx] = {
      ...msg,
      rawContent: next,
      content: next,
    }
    scrollToBottom()
  }

  /** 收到 SSE 增量：HTML/长文本立即刷新，短文本合并到下一帧（对齐 PC displayLoop 策略） */
  const appendStreamChunk = (chunk: string) => {
    pendingChunk += chunk
    if (chunk.length > 20 || chunk.startsWith('<')) {
      if (flushRaf !== null) {
        cancelAnimationFrame(flushRaf)
        flushRaf = null
      }
      flushAssistantContent()
      return
    }
    if (flushRaf === null) {
      flushRaf = requestAnimationFrame(flushAssistantContent)
    }
  }

  try {
    await sendChatMessage(
      content || '请分析这份案卷',
      sessionId.value,
      filesToSend,
      appendStreamChunk,
    )
    if (flushRaf !== null) {
      cancelAnimationFrame(flushRaf)
      flushRaf = null
    }
    flushAssistantContent()

    const doneMsg = messages.value[assistantIdx]
    if (doneMsg) {
      messages.value[assistantIdx] = { ...doneMsg, streaming: false }
    }

    if (!sessionId.value) {
      await loadSessions()
      const latest = sessions.value[0]
      if (latest) sessionId.value = latest.session_id
    }
  } catch {
    if (flushRaf !== null) cancelAnimationFrame(flushRaf)
    flushAssistantContent()
    const errMsg = messages.value[assistantIdx]
    if (errMsg) {
      messages.value[assistantIdx] = {
        ...errMsg,
        content: errMsg.content || '对话失败，请稍后重试',
        streaming: false,
      }
    }
  } finally {
    streaming.value = false
    loading.value = false
  }
}

onMounted(async () => {
  await initAgent()
  await loadSessions()
})

watch(messages, scrollToBottom, { deep: true })
</script>

<template>
  <div class="chat-page">
    <AppHeader title="案卷评测助手">
      <template #right>
        <van-button size="small" round plain hairline class="header-btn" @click="showHistory = true">
          历史
        </van-button>
      </template>
    </AppHeader>

    <!-- 历史会话抽屉 -->
    <van-popup v-model:show="showHistory" position="left" :style="{ width: '85%', height: '100%' }">
      <div class="history-drawer">
        <van-nav-bar title="对话历史">
          <template #right>
            <van-button size="small" type="primary" round @click="startNewChat">新对话</van-button>
          </template>
        </van-nav-bar>
        <van-empty v-if="sessions.length === 0" description="暂无历史记录" />
        <van-cell-group v-else inset>
          <van-cell
            v-for="s in sessions"
            :key="s.session_id"
            :title="s.title || '未命名对话'"
            is-link
            :class="{ active: sessionId === s.session_id }"
            @click="loadSession(s.session_id)"
          />
        </van-cell-group>
      </div>
    </van-popup>

    <!-- 主内容：消息 + 目录 + 输入 -->
    <div class="chat-main">
      <div ref="messagesEl" class="messages-area">
        <div v-if="messages.length === 0" class="welcome-block">
          <van-image round width="64" height="64" :src="agent?.head_image_url || ''" />
          <p class="intro">{{ agent?.introduction }}</p>
          <p class="hint">上传案卷 PDF 后，可问我：</p>
          <div class="suggestions">
            <van-tag
              v-for="(q, i) in suggestions"
              :key="i"
              plain
              type="primary"
              size="large"
              class="suggestion-chip"
              @click="handleSend(q)"
            >
              # {{ q }}
            </van-tag>
          </div>
          <van-button round type="primary" icon="plus" @click="triggerUpload">
            上传案卷 PDF
          </van-button>
        </div>

        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="message-row"
          :class="msg.role"
        >
          <van-image
            v-if="msg.role === 'assistant'"
            round
            width="32"
            height="32"
            class="msg-avatar"
            :src="agent?.head_image_url || ''"
          />
          <div class="bubble" :class="msg.role">
            <div v-if="msg.files?.length" class="msg-files">
              <div v-for="(f, fi) in msg.files" :key="fi" class="msg-file">
                📄 {{ f.name }}
                <span class="file-size">{{ formatFileSize(f.size) }}</span>
              </div>
            </div>
            <ChatMessageBody
              v-if="msg.role === 'assistant'"
              :content="msg.content"
              :raw-content="msg.rawContent"
            />
            <span v-else>{{ msg.content }}</span>
            <span v-if="msg.streaming" class="cursor">▍</span>
          </div>
        </div>
      </div>

      <!-- 待发送附件预览 -->
      <div v-if="pendingFiles.length || uploadTip" class="pending-bar">
        <van-notice-bar v-if="uploadTip" :scrollable="false" left-icon="info-o" :text="uploadTip" />
        <div v-if="pendingFiles.length" class="pending-files">
          <van-tag
            v-for="(f, i) in pendingFiles"
            :key="i"
            closeable
            type="primary"
            plain
            @close="removePendingFile(i)"
          >
            {{ f.modal_type === 'file' ? '📄' : '🖼' }} {{ f.name }}
            ({{ formatFileSize(f.size) }})
          </van-tag>
        </div>
      </div>

      <div class="input-bar">
        <van-button
          icon="plus"
          round
          size="small"
          :disabled="streaming"
          @click="triggerUpload"
        />
        <van-field
          v-model="inputText"
          class="chat-input-field"
          placeholder="说出您的需要"
          :disabled="streaming"
          @keyup.enter="handleSend()"
        />
        <van-button
          type="primary"
          round
          size="small"
          :loading="streaming"
          :disabled="!inputText.trim() && !pendingFiles.length"
          @click="handleSend()"
        >
          发送
        </van-button>
      </div>
    </div>

    <CaseUploadDialog v-model="showUploadDialog" @submit="onUploadSubmit" />

    <PdfPreviewSheet v-model:show="showPdfPreview" :preview="pdfPreview" />
  </div>
</template>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #e6f4ff 0%, #f5f8ff 100%);
  position: relative;
}
.header-btn {
  color: #fff !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  background: transparent !important;
}
.history-drawer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--van-background-2);
}
.history-drawer :deep(.van-cell.active) {
  background: var(--van-primary-color-light);
}
.chat-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.messages-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}
.welcome-block {
  text-align: center;
  padding: 24px 0;
}
.agent-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin-bottom: 12px;
}
.intro {
  font-size: 15px;
  color: var(--text);
  margin-bottom: 16px;
  line-height: 1.6;
}
.hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.suggestion-chip {
  display: block;
  width: 100%;
  padding: 10px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  text-align: left;
}
.message-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
}
.message-row.user {
  flex-direction: row-reverse;
}
.message-row.assistant {
  /* 助手气泡占满剩余宽度，避免随内容伸缩 */
  width: 100%;
}
.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}
.bubble {
  min-width: 0;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  box-sizing: border-box;
}
.bubble.user {
  max-width: 85%;
  background: var(--primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.bubble.assistant {
  flex: 1;
  width: 0;
  max-width: calc(100% - 40px);
  background: #fff;
  box-shadow: var(--shadow);
  border-bottom-left-radius: 4px;
  overflow: hidden;
}
.bubble.assistant :deep(.message-body) {
  max-width: 100%;
  overflow-x: auto;
}
.msg-files {
  margin-bottom: 6px;
}
.msg-file {
  font-size: 12px;
  opacity: 0.9;
}
.file-size {
  margin-left: 4px;
  opacity: 0.7;
}
.cursor {
  animation: blink 1s infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
.pending-bar {
  padding: 8px 16px 0;
  flex-shrink: 0;
}
.upload-tip {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--primary);
}
.pending-files {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.input-bar {
  display: flex;
  gap: 8px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
  background: #fff;
  border-top: 1px solid var(--van-border-color);
  flex-shrink: 0;
  align-items: center;
}
.chat-input-field {
  flex: 1;
  padding: 0;
  background: var(--van-background-2);
  border-radius: 20px;
}
.chat-input-field :deep(.van-field__control) {
  padding: 8px 12px;
}
</style>
