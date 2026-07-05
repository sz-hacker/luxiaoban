<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import ScrollLoadList from '@/components/common/ScrollLoadList.vue'
import { usePagedList } from '@/composables/usePagedList'
import { getTaskTodos, getTaskStatusCount } from '@/api'
import type { TaskStatusCount, TaskTodo } from '@/types/api'

/** 到期筛选 Tab，对齐 Web 待办任务页 */
type FilterKey = -2 | 1 | 3 | 7 | -1
const filterTabs: { key: FilterKey; label: string }[] = [
  { key: -2, label: '全部待办' },
  { key: 1, label: '今天到期' },
  { key: 3, label: '3天内' },
  { key: 7, label: '7天内' },
  { key: -1, label: '已超期' },
]

const activeFilter = ref<FilterKey>(-2)
const statusCount = ref<TaskStatusCount | null>(null)

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
  fetcher: async (page, pageSize) => {
    const res = await getTaskTodos({
      status: activeFilter.value,
      page,
      page_size: pageSize,
    })
    if (res.code !== 200) throw new Error(res.message || '加载失败')
    return {
      list: res.data,
      total: res.total ?? res.data.length,
    }
  },
})

/** 格式化 Unix 时间戳 */
function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('zh-CN')
}

/** 加载到期统计卡片 */
async function loadStatusCount() {
  const res = await getTaskStatusCount()
  if (res.code === 200) statusCount.value = res.data
}

/** 下拉刷新：列表 + 统计 */
async function onRefresh() {
  await Promise.all([refresh(), loadStatusCount()])
}

watch(activeFilter, reload)

onMounted(async () => {
  await Promise.all([loadStatusCount(), reload()])
})
</script>

<template>
  <div class="task-panel">
    <ScrollLoadList
      :loading="loading"
      :refreshing="refreshing"
      :loading-more="loadingMore"
      :has-more="hasMore"
      @refresh="onRefresh"
      @load-more="loadMore"
    >
      <!-- 到期提醒统计卡片 -->
      <van-grid v-if="statusCount" :column-num="2" :border="false" class="stat-grid">
        <van-grid-item>
          <div class="stat-num today">{{ statusCount.count_today }}</div>
          <div class="stat-label">今天到期</div>
          <div class="stat-hint">密切注意</div>
        </van-grid-item>
        <van-grid-item>
          <div class="stat-num three">{{ statusCount.count_three }}</div>
          <div class="stat-label">3天内到期</div>
          <div class="stat-hint">紧急处理</div>
        </van-grid-item>
        <van-grid-item>
          <div class="stat-num week">{{ statusCount.count_week }}</div>
          <div class="stat-label">7天内到期</div>
          <div class="stat-hint">保持关注</div>
        </van-grid-item>
        <van-grid-item>
          <div class="stat-num delay">{{ statusCount.count_delay }}</div>
          <div class="stat-label">超期任务</div>
          <div class="stat-hint">立即处理</div>
        </van-grid-item>
      </van-grid>

      <!-- 筛选 Tab -->
      <van-tabs v-model:active="activeFilter" shrink sticky offset-top="0" class="filter-tabs">
        <van-tab v-for="tab in filterTabs" :key="tab.key" :name="tab.key" :title="tab.label" />
      </van-tabs>

      <van-notice-bar v-if="!loading" left-icon="info-o" :scrollable="false" class="total-bar">
        共 {{ total }} 条待办
      </van-notice-bar>

      <van-empty v-if="!loading && list.length === 0" description="暂无待办任务" />

      <van-cell-group v-for="item in list" :key="item.id" inset class="todo-group">
        <van-cell :title="item.title" :label="item.content" title-class="todo-title" />
        <van-cell>
          <template #title>
            <div class="todo-meta">
              <span>{{ item.company_name }}</span>
              <span>截止 {{ formatTime(item.end_time) }}</span>
            </div>
          </template>
        </van-cell>
        <van-cell :title="`经办人：${item.user_name}`">
          <template #value>
            <van-button size="small" round type="primary">办理</van-button>
          </template>
        </van-cell>
      </van-cell-group>
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

.stat-grid {
  margin-bottom: var(--space-2);
  background: #fff;
  width: 100%;
}

.stat-num {
  font-size: var(--font-xl);
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: var(--font-sm);
  font-weight: 500;
  margin-top: var(--space-1);
}

.stat-hint {
  font-size: var(--font-xs);
  color: var(--van-gray-6);
  margin-top: var(--space-1);
}

.stat-num.today {
  color: #fa8c16;
}

.stat-num.three {
  color: #fa541c;
}

.stat-num.week {
  color: var(--van-primary-color);
}

.stat-num.delay {
  color: var(--van-danger-color);
}

.filter-tabs {
  margin-bottom: var(--space-2);
}

.total-bar {
  margin-bottom: var(--space-2);
  border-radius: var(--van-radius-md);
}

.todo-group {
  margin-bottom: var(--space-2);
}

.todo-group :deep(.todo-title) {
  font-weight: 600;
  font-size: var(--font-md);
}

.todo-meta {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: var(--font-sm);
  color: var(--van-gray-6);
}
</style>
