<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import PdfPreviewSheet from '@/components/common/PdfPreviewSheet.vue'
import { usePdfPreview } from '@/composables/usePdfPreview'
import ReviewDirectoryDrawer from '@/components/review/ReviewDirectoryDrawer.vue'
import ReviewRoundPanel from '@/components/review/ReviewRoundPanel.vue'
import { getParseTaskDetail, getReviewStream, startReviewAsync } from '@/api/caseReview'
import { getCaseStatusLabel } from '@/constants/case'
import type { CaseDirectoryEntry, ParseTaskDetail, ReviewStreamData, ReviewSubTabKey } from '@/types/review'
import { buildLiveReviewRound, parseReviewRounds } from '@/utils/review'

const route = useRoute()

/** 案卷 ID */
const taskId = computed(() => Number(route.params.id))

const detail = ref<ParseTaskDetail | null>(null)
const stream = ref<ReviewStreamData | null>(null)
const loading = ref(true)
const reviewing = ref(false)
const error = ref('')

/** 当前展开的评查轮次 id（van-collapse accordion 绑定） */
const expandedRoundId = ref<string>('')
/** 各轮次子 Tab 选中状态 */
const subTabByRound = ref<Record<string, ReviewSubTabKey>>({})

/** 目录抽屉 */
const showDirectory = ref(false)
/** PDF 预览 */
const { showPdfPreview, pdfPreview, openPdfPreview } = usePdfPreview()
const previewPage = ref(1)

/** 轮询定时器 */
let pollTimer: ReturnType<typeof setInterval> | null = null

/** 页面标题 */
const pageTitle = computed(() => detail.value?.cfwh_no || '评查流程')

/** 文书目录 */
const directory = computed(() => detail.value?.directory ?? [])

/** 打开案卷 PDF 预览（与 AI Tab 共用 PdfPreviewSheet + pdf.js 缓存） */
function openCasePdfAtPage(page: number) {
  const url = detail.value?.file_info?.url
  if (!url || page <= 0) return
  previewPage.value = page
  openPdfPreview({ pdfUrl: url, pageNum: page })
}

/** 工具栏：打开当前页 PDF */
function openPreview() {
  openCasePdfAtPage(previewPage.value)
}
/** 历次评查列表（对齐 Web：最新在上，评查中置顶） */
const reviewRounds = computed(() => {
  const history = parseReviewRounds(detail.value?.content)
  if (reviewing.value && stream.value) {
    const liveRound = buildLiveReviewRound(stream.value, history.length + 1)
    return [liveRound, ...history]
  }
  return history
})

/** 默认展开最新一轮 */
watch(
  reviewRounds,
  (rounds) => {
    if (!rounds.length) {
      expandedRoundId.value = ''
      return
    }
    if (!expandedRoundId.value || !rounds.some((r) => r.id === expandedRoundId.value)) {
      expandedRoundId.value = rounds[0]!.id
    }
  },
  { immediate: true },
)

/** 获取某轮次子 Tab，默认合规性 */
function getSubTab(roundId: string): ReviewSubTabKey {
  return subTabByRound.value[roundId] ?? 'compliance'
}

/** 更新轮次子 Tab */
function setSubTab(roundId: string, tab: ReviewSubTabKey) {
  subTabByRound.value = { ...subTabByRound.value, [roundId]: tab }
}

/** 加载案卷详情 */
async function loadDetail() {
  const res = await getParseTaskDetail(taskId.value)
  if (res.code !== 200) throw new Error(res.message || '加载案卷失败')
  detail.value = res.data
}

/** 加载评查流结果（评查进行中） */
async function loadStream() {
  const res = await getReviewStream(taskId.value)
  if (res.code !== 200) throw new Error(res.message || '加载评查结果失败')
  stream.value = res.data
  return res.data
}

/** 轮询评查进度（status=1 评查中） */
function startPolling() {
  stopPolling()
  pollTimer = setInterval(async () => {
    try {
      const data = await loadStream()
      if (data.status === 'complete') {
        reviewing.value = false
        stopPolling()
        await loadDetail()
      }
    } catch {
      /* 轮询失败静默重试 */
    }
  }, 2500)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

/** 初始化：未评查则触发一键评查，评查中则轮询 */
async function initPage() {
  loading.value = true
  error.value = ''
  try {
    await loadDetail()
    if (detail.value!.status === 0) {
      reviewing.value = true
      await startReviewAsync(taskId.value)
      await loadDetail()
    }
    if (detail.value!.status === 1) {
      reviewing.value = true
      await loadStream()
      startPolling()
    } else if (reviewing.value || detail.value!.status === 0) {
      await loadStream()
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

/** 评查结果点击页码：打开 PDF 并定位 */
function locatePage(page: number) {
  openCasePdfAtPage(page)
}

/** 目录选中：打开 PDF 并关闭抽屉 */
function onDirectorySelect(_entry: CaseDirectoryEntry, page: number) {
  openCasePdfAtPage(page)
  showDirectory.value = false
}

onMounted(initPage)
onUnmounted(stopPolling)
</script>

<template>
  <div class="review-process-page">
    <AppHeader :title="pageTitle" show-back>
      <template #right>
        <van-tag v-if="detail" plain color="rgba(255,255,255,0.9)" text-color="#1677ff">
          {{ getCaseStatusLabel(detail.status) }}
        </van-tag>
      </template>
    </AppHeader>

    <!-- 工具栏：目录 + PDF 预览 -->
    <div class="toolbar">
      <van-button block plain icon="bars" @click="showDirectory = true">目录</van-button>
      <van-button
        block
        type="primary"
        plain
        icon="description"
        :disabled="!detail?.file_info?.url"
        @click="openPreview()"
      >
        PDF 预览 · P{{ previewPage }}
      </van-button>
    </div>

    <!-- 评查进度提示 -->
    <van-notice-bar v-if="reviewing" left-icon="info-o" :scrollable="false" class="review-progress">
      AI 评查进行中… {{ detail?.progress ?? 0 }}%
    </van-notice-bar>

    <van-loading v-if="loading" vertical class="page-loading">加载中…</van-loading>
    <van-empty v-else-if="error" :description="error" />

    <!-- 历次评查 -->
    <div v-else class="round-list">
      <van-empty v-if="!reviewRounds.length" description="暂无评查记录" />
      <van-collapse v-else v-model="expandedRoundId" accordion>
        <ReviewRoundPanel
          v-for="round in reviewRounds"
          :key="round.id"
          :round="round"
          :expanded="expandedRoundId === round.id"
          :active-sub-tab="getSubTab(round.id)"
          @update:sub-tab="setSubTab(round.id, $event)"
          @locate-page="locatePage"
        />
      </van-collapse>
    </div>

    <ReviewDirectoryDrawer
      :visible="showDirectory"
      :items="directory"
      :current-page="previewPage"
      @close="showDirectory = false"
      @select="onDirectorySelect"
    />

    <PdfPreviewSheet v-model:show="showPdfPreview" :preview="pdfPreview" />
  </div>
</template>

<style scoped>
.review-process-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg);
}

.status-chip {
  font-size: var(--font-sm);
}

.toolbar {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--page-margin-x);
  background: #fff;
  border-bottom: 1px solid var(--van-border-color);
  flex-shrink: 0;
}

.review-progress {
  margin: var(--space-2) var(--page-margin-x) 0;
  border-radius: var(--van-radius-md);
}

.page-loading {
  padding: 48px 0;
}

.round-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) var(--page-margin-x) var(--page-margin-bottom);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.empty-tab {
  text-align: center;
  padding: var(--space-4);
  color: var(--text-secondary);
  font-size: var(--font-sm);
}
</style>
