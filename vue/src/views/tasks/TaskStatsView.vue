<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import EChart from '@/components/charts/EChart.vue'
import {
  getSourceDistribution,
  getTaskTrends,
  getTypeDistribution,
  getUrgentDistribution,
} from '@/api'
import type { SourceDistributionItem, TaskTrendItem, TypeDistribution, UrgentItem } from '@/types/api'
import {
  buildSourceDonutOption,
  buildSourceLegend,
  buildTrendLineOption,
  buildTypeDonutOption,
  buildTypeLegend,
  buildUrgentBarOption,
  buildUrgentLegend,
} from '@/utils/taskStatsCharts'

const loading = ref(false)
const urgentRaw = ref<UrgentItem[]>([])
const typeRaw = ref<TypeDistribution[]>([])
const sourceRaw = ref<SourceDistributionItem[]>([])
const trendRaw = ref<TaskTrendItem[]>([])

/** 图例数据 */
const urgentLegend = computed(() => buildUrgentLegend(urgentRaw.value))
const typeLegend = computed(() => buildTypeLegend(typeRaw.value))
const sourceLegend = computed(() => buildSourceLegend(sourceRaw.value))

/** ECharts 配置 */
const urgentOption = computed(() => buildUrgentBarOption(urgentLegend.value))
const typeOption = computed(() => buildTypeDonutOption(typeLegend.value))
const sourceOption = computed(() => buildSourceDonutOption(sourceLegend.value))
const trendOption = computed(() =>
  buildTrendLineOption(
    trendRaw.value.map((item) => item.date),
    trendRaw.value.map((item) => item.newCount),
    trendRaw.value.map((item) => item.doneCount),
  ),
)

/** 加载全部统计数据 */
async function loadStats() {
  loading.value = true
  try {
    const [urgentRes, typeRes, sourceRes, trendRes] = await Promise.all([
      getUrgentDistribution(),
      getTypeDistribution(),
      getSourceDistribution(),
      getTaskTrends(30),
    ])
    if (urgentRes.code === 200) urgentRaw.value = urgentRes.data
    if (typeRes.code === 200) typeRaw.value = typeRes.data
    if (sourceRes.code === 200) sourceRaw.value = sourceRes.data
    if (trendRes.code === 200) trendRaw.value = trendRes.data
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<template>
  <div class="task-stats-page">
    <van-loading v-if="loading" vertical class="stats-loading">加载中…</van-loading>

    <div v-else class="stats-stack">
      <van-cell-group inset class="stats-card">
        <van-cell title="紧急任务分布" value="不含个人任务" title-class="card-title" />
        <div class="chart-wrap">
          <EChart :option="urgentOption" height="220px" />
        </div>
        <van-cell v-for="item in urgentLegend" :key="item.name">
          <template #title>
            <span class="legend-dot" :style="{ backgroundColor: item.color }" />
            {{ item.name }}
          </template>
          <template #value>{{ item.value }}</template>
        </van-cell>
      </van-cell-group>

      <van-cell-group inset class="stats-card">
        <van-cell title="任务类型分布" title-class="card-title" />
        <div class="chart-wrap">
          <EChart :option="typeOption" height="220px" />
        </div>
        <van-cell v-for="item in typeLegend" :key="item.name">
          <template #title>
            <span class="legend-dot" :style="{ backgroundColor: item.color }" />
            {{ item.name }}
          </template>
          <template #value>{{ item.value }} ({{ item.percent }})</template>
        </van-cell>
      </van-cell-group>

      <van-cell-group inset class="stats-card">
        <van-cell title="任务来源分布" value="Top10" title-class="card-title" />
        <div class="chart-wrap">
          <EChart :option="sourceOption" height="220px" />
        </div>
        <van-empty v-if="!sourceLegend.length" description="暂无数据" />
        <van-cell v-for="item in sourceLegend" :key="item.name">
          <template #title>
            <span class="legend-dot" :style="{ backgroundColor: item.color }" />
            <span class="legend-name">{{ item.name }}</span>
          </template>
          <template #value>{{ item.value }} ({{ item.percent }})</template>
        </van-cell>
      </van-cell-group>

      <van-cell-group inset class="stats-card">
        <van-cell title="近期任务趋势" value="近 30 天" title-class="card-title" />
        <div class="chart-wrap">
          <EChart :option="trendOption" height="260px" />
        </div>
      </van-cell-group>
    </div>
  </div>
</template>

<style scoped>
.task-stats-page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--page-margin-y) 0 var(--page-margin-bottom);
}

.stats-loading {
  padding: 48px 0;
}

.stats-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.stats-card {
  overflow: hidden;
}

.stats-card :deep(.card-title) {
  font-weight: 600;
  font-size: var(--font-md);
}

.chart-wrap {
  padding: 0 var(--space-2);
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}

.legend-name {
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: clamp(120px, 42vw, 200px);
  display: inline-block;
}
</style>
