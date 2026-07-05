<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  showConfirmDialog,
  showFailToast,
  showLoadingToast,
  showSuccessToast,
  closeToast,
} from 'vant'
import ScrollLoadList from '@/components/common/ScrollLoadList.vue'
import TaskFormPopup from '@/components/tasks/TaskFormPopup.vue'
import { usePagedList } from '@/composables/usePagedList'
import { deleteTasks } from '@/api'
import {
  exportTaskTemplatesToExcel,
  fetchAllTaskTemplates,
  fetchTaskTemplatesPage,
  formatTaskTimeRange,
  getTaskCycleLabel,
  getTaskTemplateStatusLabel,
  getTaskTemplateStatusTagProps,
  getTaskTypeLabel,
  TASK_CYCLE_OPTIONS,
  TASK_TEMPLATE_STATUS_OPTIONS,
  type TaskTemplateFilters,
} from '@/utils/taskTemplate'
import { formatTaskCreatedAt } from '@/utils/task'
import type { TaskRecord } from '@/types/api'

/** 筛选 Picker 哨兵值：表示「全部」 */
const FILTER_ALL = -1

/** 筛选 Picker 列（含「全部」） */
const cycleFilterColumns = [
  { text: '全部', value: FILTER_ALL },
  ...TASK_CYCLE_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
]

const statusFilterColumns = [
  { text: '全部', value: FILTER_ALL },
  ...TASK_TEMPLATE_STATUS_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
]

/** draft 与 API 筛选值互转 */
function draftToFilter(value: number): number | null {
  return value === FILTER_ALL ? null : value
}

function filterToDraft(value: number | null): number {
  return value ?? FILTER_ALL
}

/** 筛选展示文案 */
function cycleFilterLabel(value: number | null) {
  if (value == null) return '全部'
  return getTaskCycleLabel(value)
}

function statusFilterLabel(value: number | null) {
  if (value == null) return '全部'
  return getTaskTemplateStatusLabel(value)
}

/** 统一搜索关键词 */
const searchKeyword = ref('')

/** 高级筛选：任务周期、任务状态（null 表示全部） */
const filterCycle = ref<number | null>(null)
const filterStatus = ref<number | null>(null)
const showFilterPopup = ref(false)

/** 筛选弹层临时值（Picker 用数字，FILTER_ALL 表示全部） */
const draftCycle = ref<number>(FILTER_ALL)
const draftStatus = ref<number>(FILTER_ALL)
const showDraftCyclePicker = ref(false)
const showDraftStatusPicker = ref(false)

const exporting = ref(false)

/** 表单弹层 */
const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const editingRecord = ref<TaskRecord | null>(null)

/** 当前生效的筛选条件 */
function currentFilters(): TaskTemplateFilters {
  return {
    keyword: searchKeyword.value,
    cycle_period: filterCycle.value,
    status: filterStatus.value,
  }
}

const {
  list,
  total,
  loading,
  loadingMore,
  refreshing,
  hasMore,
  reload,
  refresh,
  loadMore,
} = usePagedList<TaskRecord>({
  pageSize: 10,
  fetcher: async (page, pageSize) => fetchTaskTemplatesPage(currentFilters(), page, pageSize),
})

/** 执行搜索 */
function onSearch() {
  reload()
}

/** 重置全部筛选 */
function onResetAll() {
  searchKeyword.value = ''
  filterCycle.value = null
  filterStatus.value = null
  draftCycle.value = FILTER_ALL
  draftStatus.value = FILTER_ALL
  showFilterPopup.value = false
  reload()
}

/** 打开筛选抽屉 */
function openFilterPopup() {
  draftCycle.value = filterToDraft(filterCycle.value)
  draftStatus.value = filterToDraft(filterStatus.value)
  showFilterPopup.value = true
}

/** 确认筛选 */
function applyFilter() {
  filterCycle.value = draftToFilter(draftCycle.value)
  filterStatus.value = draftToFilter(draftStatus.value)
  showFilterPopup.value = false
  reload()
}

/** 重置筛选抽屉内条件 */
function resetDraftFilter() {
  draftCycle.value = FILTER_ALL
  draftStatus.value = FILTER_ALL
}

/** 打开新建表单 */
function openCreateForm() {
  formMode.value = 'add'
  editingRecord.value = null
  formVisible.value = true
}

/** 打开编辑表单（已完成不可编辑，对齐 Web status < 80） */
function openEditForm(item: TaskRecord) {
  if (item.status >= 80) {
    showFailToast('已完成任务不可编辑')
    return
  }
  formMode.value = 'edit'
  editingRecord.value = item
  formVisible.value = true
}

/** 删除任务模板 */
async function onDelete(item: TaskRecord) {
  await showConfirmDialog({
    title: '删除确认',
    message: `确定要删除「${item.title}」吗？`,
  })

  const res = await deleteTasks([item.id])
  if (res.code === 200) {
    showSuccessToast('删除成功')
    await refresh()
  } else {
    showFailToast(res.message || '删除失败')
  }
}

/** 表单提交成功后刷新列表 */
async function onFormSuccess() {
  await refresh()
}

/** 导出全量（对齐 Web page_size=2000） */
async function handleExport() {
  if (exporting.value || loading.value) return

  exporting.value = true
  showLoadingToast({ message: '正在导出…', forbidClick: true, duration: 0 })

  try {
    const allItems = await fetchAllTaskTemplates(currentFilters())
    if (allItems.length === 0) {
      showFailToast('暂无数据可导出')
      return
    }
    exportTaskTemplatesToExcel(allItems)
    showSuccessToast(`已导出 ${allItems.length} 条`)
  } catch (err) {
    console.error('任务模板导出失败:', err)
    showFailToast(err instanceof Error ? err.message : '导出失败')
  } finally {
    closeToast()
    exporting.value = false
  }
}

/** 是否有生效中的高级筛选 */
function hasActiveFilter() {
  return filterCycle.value != null || filterStatus.value != null
}

onMounted(reload)
</script>

<template>
  <div class="task-panel">
    <ScrollLoadList
      :loading="loading"
      :refreshing="refreshing"
      :loading-more="loadingMore"
      :has-more="hasMore"
      @refresh="refresh"
      @load-more="loadMore"
    >
      <!-- 搜索区 -->
      <section class="search-card full-bleed">
        <van-search
          v-model="searchKeyword"
          class="search-field"
          shape="round"
          placeholder="任务来源 / 企业名称 / 任务内容 / 经办人"
          clearable
          @search="onSearch"
          @keyup.enter="onSearch"
        />
        <div class="search-actions">
          <van-button round type="primary" @click="onSearch">搜索</van-button>
          <van-button round plain :type="hasActiveFilter() ? 'primary' : 'default'" @click="openFilterPopup">
            筛选
          </van-button>
          <van-button round type="success" :loading="exporting" @click="handleExport">导出</van-button>
        </div>
      </section>

      <van-notice-bar v-if="!loading" left-icon="info-o" :scrollable="false" class="total-bar full-bleed">
        共 {{ total }} 个任务模板
      </van-notice-bar>

      <van-empty v-if="!loading && list.length === 0" description="暂无任务，点击右下角新建" class="full-bleed" />

      <article v-for="item in list" :key="item.id" class="task-card full-bleed">
        <header class="task-card-head">
          <h4 class="task-title">{{ item.title }}</h4>
          <div class="task-tags">
            <van-tag plain class="task-tag">{{ getTaskTypeLabel(item.task_type) }}</van-tag>
            <van-tag v-bind="getTaskTemplateStatusTagProps(item.status)" class="task-tag">
              {{ getTaskTemplateStatusLabel(item.status) }}
            </van-tag>
          </div>
        </header>

        <p v-if="item.content" class="task-content">{{ item.content }}</p>

        <dl class="task-fields">
          <div class="field-row">
            <dt>企业名称</dt>
            <dd>{{ item.company_name || '—' }}</dd>
          </div>
          <div class="field-row">
            <dt>任务周期</dt>
            <dd>{{ getTaskCycleLabel(item.cycle_period) }}</dd>
          </div>
          <div class="field-row">
            <dt>任务时间</dt>
            <dd>{{ formatTaskTimeRange(item.start_time, item.end_time) }}</dd>
          </div>
          <div class="field-row">
            <dt>录入时间</dt>
            <dd>{{ formatTaskCreatedAt(item.created_at) }}</dd>
          </div>
          <div class="field-row">
            <dt>经办人</dt>
            <dd>{{ item.user_name || '—' }}</dd>
          </div>
        </dl>

        <footer class="task-actions">
          <van-button
            size="small"
            round
            type="primary"
            plain
            :disabled="item.status >= 80"
            @click="openEditForm(item)"
          >
            编辑
          </van-button>
          <van-button size="small" round type="danger" plain @click="onDelete(item)">删除</van-button>
        </footer>
      </article>
    </ScrollLoadList>

    <!-- 右下角 FAB 新建 -->
    <button type="button" class="fab-create" aria-label="新建任务" @click="openCreateForm">
      <van-icon name="plus" />
    </button>

    <!-- 高级筛选抽屉 -->
    <van-popup v-model:show="showFilterPopup" position="bottom" round class="filter-popup">
      <div class="filter-panel">
        <h4 class="filter-title">筛选条件</h4>

        <van-cell-group inset>
          <van-cell
            title="任务周期"
            :value="cycleFilterLabel(draftToFilter(draftCycle))"
            is-link
            @click="showDraftCyclePicker = true"
          />
          <van-cell
            title="任务状态"
            :value="statusFilterLabel(draftToFilter(draftStatus))"
            is-link
            @click="showDraftStatusPicker = true"
          />
        </van-cell-group>

        <div class="filter-actions">
          <van-button round plain @click="resetDraftFilter">重置</van-button>
          <van-button round plain type="primary" @click="onResetAll">全部清空</van-button>
          <van-button round type="primary" @click="applyFilter">确定</van-button>
        </div>
      </div>
    </van-popup>

    <van-popup v-model:show="showDraftCyclePicker" position="bottom" round>
      <van-picker
        :columns="cycleFilterColumns"
        @confirm="({ selectedOptions }) => { draftCycle = Number(selectedOptions[0]?.value ?? FILTER_ALL); showDraftCyclePicker = false }"
        @cancel="showDraftCyclePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showDraftStatusPicker" position="bottom" round>
      <van-picker
        :columns="statusFilterColumns"
        @confirm="({ selectedOptions }) => { draftStatus = Number(selectedOptions[0]?.value ?? FILTER_ALL); showDraftStatusPicker = false }"
        @cancel="showDraftStatusPicker = false"
      />
    </van-popup>

    <TaskFormPopup
      v-model:show="formVisible"
      :mode="formMode"
      :record="editingRecord"
      @success="onFormSuccess"
    />
  </div>
</template>

<style scoped>
.task-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.search-card {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
  margin-bottom: var(--space-2);
  overflow: hidden;
}

.search-field {
  padding: var(--space-2) var(--page-margin-x) 0;
}

.search-field :deep(.van-search__content) {
  background: var(--bg);
}

.search-field :deep(.van-field__control) {
  font-size: var(--font-sm);
}

.search-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
  padding: var(--space-2) var(--page-margin-x) var(--space-3);
}

.search-actions :deep(.van-button) {
  min-height: var(--touch-min);
  font-size: var(--font-sm);
  padding: 0 var(--space-2);
}

.total-bar {
  margin-bottom: var(--space-2);
  border-radius: var(--radius-sm);
}

.task-card {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
  margin-bottom: var(--space-2);
  overflow: hidden;
}

.task-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  background: #fafcff;
}

.task-title {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--text);
  line-height: 1.4;
  word-break: break-word;
}

.task-tags {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  flex-shrink: 0;
}

.task-tag {
  font-size: var(--font-xs);
}

.task-content {
  margin: 0;
  padding: var(--space-2) var(--space-3) 0;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-word;
}

.task-fields {
  margin: 0;
  padding: var(--space-2) var(--space-3) 0;
}

.field-row {
  display: grid;
  grid-template-columns: minmax(4.5em, 5.5em) 1fr;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  font-size: var(--font-sm);
  line-height: 1.5;
}

.field-row dt {
  margin: 0;
  color: var(--text-secondary);
}

.field-row dd {
  margin: 0;
  color: var(--text);
  word-break: break-all;
}

.task-actions {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3) var(--space-3);
}

.task-actions :deep(.van-button) {
  flex: 1;
  min-height: var(--touch-min);
}

/** FAB：右下角新建，避开 TabBar + Safe Area */
.fab-create {
  position: fixed;
  right: var(--page-margin-x);
  bottom: calc(var(--tabbar-h) + var(--space-3) + env(safe-area-inset-bottom, 0px));
  z-index: 10;
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #1677ff, #4096ff);
  color: #fff;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.fab-create :deep(.van-icon) {
  font-size: 24px;
}

.filter-popup {
  max-height: 70vh;
}

.filter-panel {
  padding: var(--space-3) var(--page-margin-x) var(--space-4);
  overflow-y: auto;
}

.filter-title {
  margin: 0 0 var(--space-2);
  font-size: var(--font-md);
  font-weight: 600;
}

.filter-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.filter-actions :deep(.van-button) {
  min-height: var(--touch-min);
}
</style>
