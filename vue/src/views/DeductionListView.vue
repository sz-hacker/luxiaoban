<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { getDeductionList } from '@/api'
import {
  buildDeductionYearOptions,
  DEDUCTION_QUARTER_OPTIONS,
  getCurrentQuarter,
  getQuarterLabel,
} from '@/constants/deduction'
import {
  attachRemainingScores,
  exportDeductionListToExcel,
  formatDeductionCreatedAt,
} from '@/utils/deduction'
import type { DeductionRecord } from '@/types/api'

const list = ref<DeductionRecord[]>([])
const total = ref(0)
const loading = ref(false)
const exporting = ref(false)
const showYearPicker = ref(false)
const showQuarterPicker = ref(false)

/** 年度选项：最近 20 年 */
const yearOptions = buildDeductionYearOptions()

/** 筛选条件 */
const filters = ref({
  organization_name: '',
  cfwh_no: '',
  year: new Date().getFullYear(),
  quarter: getCurrentQuarter(),
})

/** 季度 Picker 列 */
const quarterColumns = DEDUCTION_QUARTER_OPTIONS.map((item) => ({
  text: item.label,
  value: item.value,
}))

/** 年度 Picker 列 */
const yearColumns = yearOptions.map((y) => ({ text: `${y}年`, value: y }))

/** 加载扣分明细 */
async function loadData() {
  loading.value = true
  try {
    const res = await getDeductionList({
      year: filters.value.year,
      quarter: filters.value.quarter,
      organization_name: filters.value.organization_name.trim() || undefined,
      cfwh_no: filters.value.cfwh_no.trim() || undefined,
      page: 1,
      page_size: 2000,
    })
    if (res.code === 200) {
      list.value = attachRemainingScores(res.data)
      total.value = res.total ?? res.data.length
    }
  } finally {
    loading.value = false
  }
}

/** 导出当前列表为 Excel，对齐 Web deductionList 导出 */
function handleExport() {
  if (exporting.value || loading.value) return
  if (list.value.length === 0) {
    showFailToast('暂无数据可导出')
    return
  }

  exporting.value = true
  try {
    exportDeductionListToExcel(list.value, filters.value.year, filters.value.quarter)
    showSuccessToast('导出成功')
  } catch (err) {
    console.error('扣分明细导出失败:', err)
    showFailToast(err instanceof Error ? err.message : '导出失败')
  } finally {
    exporting.value = false
  }
}

/** 重置筛选为当前年/季 */
function resetFilters() {
  filters.value = {
    organization_name: '',
    cfwh_no: '',
    year: new Date().getFullYear(),
    quarter: getCurrentQuarter(),
  }
  loadData()
}

/** 年度选择确认 */
function onYearConfirm({ selectedValues }: { selectedValues: number[] }) {
  filters.value.year = selectedValues[0]!
  showYearPicker.value = false
  loadData()
}

/** 季度选择确认 */
function onQuarterConfirm({ selectedValues }: { selectedValues: number[] }) {
  filters.value.quarter = selectedValues[0]!
  showQuarterPicker.value = false
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="deduction-list-page">
    <van-cell-group inset class="filter-panel">
      <van-field v-model="filters.organization_name" label="责任单位" placeholder="责任单位" />
      <van-field v-model="filters.cfwh_no" label="处罚文号" placeholder="处罚文号" />
      <van-cell title="年度" :value="`${filters.year}年`" is-link @click="showYearPicker = true" />
      <van-cell
        title="季度"
        :value="getQuarterLabel(filters.quarter)"
        is-link
        @click="showQuarterPicker = true"
      />
      <van-cell>
        <template #default>
          <div class="filter-actions">
            <van-button size="small" @click="resetFilters">重置</van-button>
            <van-button size="small" type="primary" :loading="loading" @click="loadData">
              查询
            </van-button>
            <van-button
              size="small"
              type="success"
              plain
              :loading="exporting"
              :disabled="loading || list.length === 0"
              @click="handleExport"
            >
              导出
            </van-button>
          </div>
        </template>
      </van-cell>
    </van-cell-group>

    <van-notice-bar left-icon="info-o" :scrollable="false" class="total-bar">
      {{ filters.year }} 年 {{ getQuarterLabel(filters.quarter) }} · 共 {{ total }} 条扣分记录
    </van-notice-bar>

    <van-loading v-if="loading" vertical class="page-loading">加载中…</van-loading>
    <van-empty v-else-if="list.length === 0" description="暂无扣分明细" />

    <van-cell-group
      v-for="(item, index) in list"
      :key="item.id"
      inset
      class="deduction-group"
    >
      <van-cell title="序号" :value="String(index + 1)" />
      <van-cell title="责任单位" :value="item.organization_name" />
      <van-cell title="处罚文号" :value="item.cfwh_no" value-class="cfwh" />
      <van-cell title="标准类型" :value="item.standard_type" />
      <van-cell title="文书名称" :value="item.document_name" />
      <van-cell title="标准编号" :value="item.standard_id" />
      <van-cell title="扣分说明" :label="item.deduction_description" />
      <van-cell title="扣除分数" value-class="score">
        <template #value>-{{ item.deduction_score }} 分</template>
      </van-cell>
      <van-cell title="剩余分数" :value="`${item.remaining_score ?? '--'} 分`" />
      <van-cell title="创建时间" :value="formatDeductionCreatedAt(item.created_at)" />
    </van-cell-group>

    <van-popup v-model:show="showYearPicker" position="bottom" round>
      <van-picker
        :columns="yearColumns"
        :model-value="[filters.year]"
        @confirm="onYearConfirm"
        @cancel="showYearPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showQuarterPicker" position="bottom" round>
      <van-picker
        :columns="quarterColumns"
        :model-value="[filters.quarter]"
        @confirm="onQuarterConfirm"
        @cancel="showQuarterPicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.deduction-list-page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--page-margin-y) 0 var(--page-margin-bottom);
}

.filter-panel {
  margin-bottom: var(--space-2);
}

.filter-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
  width: 100%;
}

.total-bar {
  margin-bottom: var(--space-2);
  border-radius: var(--van-radius-md);
}

.page-loading {
  padding: 48px 0;
}

.deduction-group {
  margin-bottom: var(--space-2);
}

.deduction-group :deep(.cfwh) {
  font-weight: 600;
}

.deduction-group :deep(.score) {
  color: var(--van-danger-color);
  font-weight: 700;
}
</style>
