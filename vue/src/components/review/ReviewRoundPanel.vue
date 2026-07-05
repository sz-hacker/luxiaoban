<script setup lang="ts">
import {
  REVIEW_SUB_TABS,
  type ComplianceReviewItem,
  type PenetrateReviewItem,
  type ReviewRound,
  type ReviewSubTabKey,
} from '@/types/review'
import { formatReviewElapsed, getReviewSectionStatusLabel, parseFirstPage } from '@/utils/review'

const props = defineProps<{
  round: ReviewRound
  expanded: boolean
  activeSubTab: ReviewSubTabKey
}>()

const emit = defineEmits<{
  toggle: []
  'update:subTab': [tab: ReviewSubTabKey]
  locatePage: [page: number]
}>()

/** 当前子 Tab 状态文案 */
const subTabStatus = (tab: ReviewSubTabKey) => {
  const items = tab === 'compliance' ? props.round.compliance : props.round.penetrate
  if (!props.round.isLive) return items.length ? '已完成' : '未发现异常'
  const status = tab === 'compliance' ? props.round.complianceStatus : props.round.penetrateStatus
  return getReviewSectionStatusLabel(status ?? '')
}

/** 合规性项点击：定位页码 */
function onComplianceClick(item: ComplianceReviewItem) {
  if (item.problem_page) emit('locatePage', item.problem_page)
}

/** 穿透性项点击：定位页码 */
function onPenetrateClick(item: PenetrateReviewItem) {
  emit('locatePage', parseFirstPage(item.pages))
}
</script>

<template>
  <van-collapse-item :name="round.id" :title="round.title" class="round-panel">
    <template #title>
      <div class="round-meta">
        <span class="round-title">{{ round.title }}</span>
        <span class="round-time">{{ round.timestamp }}</span>
        <span v-if="round.elapsed != null" class="round-elapsed">
          {{ formatReviewElapsed(round.elapsed) }}
        </span>
        <van-tag v-if="round.isLive" type="primary" plain size="medium">评查中</van-tag>
      </div>
    </template>

    <van-tabs
      :active="activeSubTab"
      shrink
      @update:active="emit('update:subTab', $event as ReviewSubTabKey)"
    >
      <van-tab v-for="tab in REVIEW_SUB_TABS" :key="tab.key" :name="tab.key" :title="tab.label" />
    </van-tabs>

    <van-notice-bar :scrollable="false" left-icon="info-o" class="sub-status">
      {{ REVIEW_SUB_TABS.find((t) => t.key === activeSubTab)?.label }} ·
      {{ subTabStatus(activeSubTab) }}
    </van-notice-bar>

    <!-- 合规性结果 -->
    <div v-if="activeSubTab === 'compliance'" class="result-list">
      <p v-if="round.complianceMessage" class="result-summary">{{ round.complianceMessage }}</p>
      <van-empty
        v-if="!round.compliance.length"
        :description="
          round.isLive && round.complianceStatus === 'running'
            ? '合规性评查进行中…'
            : '未发现异常问题'
        "
      />
      <van-cell
        v-for="(item, i) in round.compliance"
        :key="item.review_item_id ?? i"
        is-link
        @click="onComplianceClick(item)"
      >
        <template #title>
          <div class="card-head">
            <span class="card-title">{{ item.category }}</span>
            <span class="score">-{{ item.deduction_score }}分</span>
          </div>
        </template>
        <template #label>
          <p class="card-desc">{{ item.deduction_description }}</p>
          <div class="card-meta">
            <span>标准 {{ item.standard_id }}</span>
            <span v-if="item.problem_page" class="link">P{{ item.problem_page }} ›</span>
          </div>
        </template>
      </van-cell>
    </div>

    <!-- 穿透性结果 -->
    <div v-else class="result-list">
      <p v-if="round.penetrateMessage" class="result-summary">{{ round.penetrateMessage }}</p>
      <van-empty
        v-if="!round.penetrate.length"
        :description="
          round.isLive && round.penetrateStatus === 'running'
            ? '穿透性评查进行中…'
            : '未发现异常问题'
        "
      />
      <van-cell
        v-for="(item, i) in round.penetrate"
        :key="i"
        is-link
        @click="onPenetrateClick(item)"
      >
        <template #title>
          <div class="card-head">
            <span class="card-title">{{ item.dimension }}</span>
            <van-tag type="warning" plain>{{ item.review_content }}</van-tag>
          </div>
        </template>
        <template #label>
          <p class="card-desc">{{ item.problem_description }}</p>
          <div class="card-meta">
            <span>{{ item.review_element }}</span>
            <span class="link">P{{ item.pages }} ›</span>
          </div>
        </template>
      </van-cell>
    </div>
  </van-collapse-item>
</template>

<style scoped>
.round-panel {
  margin-bottom: var(--space-2);
  border-radius: var(--van-radius-lg);
  overflow: hidden;
}

.round-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.round-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.round-time,
.round-elapsed {
  font-size: 12px;
  color: var(--text-secondary);
}

.sub-status {
  margin: var(--space-2) 0;
}

.result-summary {
  margin: 0 var(--space-3) var(--space-2);
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.result-list {
  padding: 0;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.card-title {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
  flex: 1;
}

.score {
  color: var(--danger);
  font-weight: 700;
  flex-shrink: 0;
}

.tag {
  flex-shrink: 0;
}

.card-desc {
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 var(--space-2);
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.link {
  color: var(--primary);
}
</style>
