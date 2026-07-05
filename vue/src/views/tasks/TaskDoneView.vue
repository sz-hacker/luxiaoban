<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showFailToast, showLoadingToast, showSuccessToast, closeToast } from 'vant'
import ScrollLoadList from '@/components/common/ScrollLoadList.vue'
import { usePagedList } from '@/composables/usePagedList'
import {
  exportTaskDoneToExcel,
  fetchAllDoneTasks,
  fetchDoneTasksPage,
  formatTaskDate,
  formatTaskDateTime,
  getTaskStatusLabel,
} from '@/utils/taskTodo'
import type { TaskTodo } from '@/types/api'

const exporting = ref(false)

/** 统一搜索关键词，匹配任务来源/企业名称/任务内容/经办人 */
const searchKeyword = ref('')

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
} = usePagedList<TaskTodo>({
  pageSize: 10,
  fetcher: async (page, pageSize) => fetchDoneTasksPage(searchKeyword.value, page, pageSize),
})

/** 执行搜索：回到第一页 */
function onSearch() {
  reload()
}

/** 重置筛选条件 */
function onReset() {
  searchKeyword.value = ''
  reload()
}

/** 导出全量已办任务（对齐 Web：page_size=2000，不受分页限制） */
async function handleExport() {
  if (exporting.value || loading.value) return

  exporting.value = true
  showLoadingToast({ message: '正在导出…', forbidClick: true, duration: 0 })

  try {
    const allItems = await fetchAllDoneTasks(searchKeyword.value)
    if (allItems.length === 0) {
      showFailToast('暂无数据可导出')
      return
    }
    exportTaskDoneToExcel(allItems)
    showSuccessToast(`已导出 ${allItems.length} 条`)
  } catch (err) {
    console.error('已办任务导出失败:', err)
    showFailToast(err instanceof Error ? err.message : '导出失败')
  } finally {
    closeToast()
    exporting.value = false
  }
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
      <!-- 搜索区：全宽卡片，输入框 + 操作按钮 -->
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
          <van-button round plain type="primary" @click="onReset">重置</van-button>
          <van-button round type="success" :loading="exporting" @click="handleExport">
            导出
          </van-button>
        </div>
      </section>

      <van-notice-bar v-if="!loading" left-icon="info-o" :scrollable="false" class="total-bar full-bleed">
        共 {{ total }} 条已办记录
      </van-notice-bar>

      <van-empty v-if="!loading && list.length === 0" description="暂无已办任务" class="full-bleed" />

      <article v-for="item in list" :key="item.id" class="todo-card full-bleed">
        <header class="todo-card-head">
          <h4 class="todo-title">{{ item.title }}</h4>
          <van-tag type="success" plain class="todo-tag">{{ getTaskStatusLabel(item.status) }}</van-tag>
        </header>

        <p v-if="item.content" class="todo-content">{{ item.content }}</p>

        <dl class="todo-fields">
          <div class="field-row">
            <dt>企业名称</dt>
            <dd>{{ item.company_name || '—' }}</dd>
          </div>
          <div class="field-row">
            <dt>到期时间</dt>
            <dd>{{ formatTaskDate(item.end_time) }}</dd>
          </div>
          <div class="field-row">
            <dt>录入时间</dt>
            <dd>{{ formatTaskDateTime(item.created_at) }}</dd>
          </div>
          <div class="field-row">
            <dt>经办人</dt>
            <dd>{{ item.user_name || '—' }}</dd>
          </div>
        </dl>
      </article>
    </ScrollLoadList>
  </div>
</template>

<style scoped>
.task-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/** 搜索卡片：全宽，内边距随屏宽缩放 */
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

/** 任务卡片：对齐 CaseReviewView 的 field-row 布局 */
.todo-card {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
  margin-bottom: var(--space-2);
  overflow: hidden;
}

.todo-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  background: #fafcff;
}

.todo-title {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--text);
  line-height: 1.4;
  word-break: break-word;
}

.todo-tag {
  flex-shrink: 0;
  font-size: var(--font-xs);
}

.todo-content {
  margin: 0;
  padding: var(--space-2) var(--space-3) 0;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-word;
}

.todo-fields {
  margin: 0;
  padding: var(--space-2) var(--space-3) var(--space-3);
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
  flex-shrink: 0;
}

.field-row dd {
  margin: 0;
  color: var(--text);
  word-break: break-all;
}
</style>
