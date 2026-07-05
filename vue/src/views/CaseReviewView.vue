<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast, showToast } from 'vant'
import ScrollLoadList from '@/components/common/ScrollLoadList.vue'
import CaseUploadSheet from '@/components/cases/CaseUploadSheet.vue'
import { usePagedList } from '@/composables/usePagedList'
import { getCaseList } from '@/api'
import { deleteParseTask } from '@/api/caseReview'
import { formatCaseCreatedAt } from '@/utils/case'
import type { CaseRecord } from '@/types/api'

const router = useRouter()
const uploadVisible = ref(false)

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
} = usePagedList<CaseRecord>({
  pageSize: 10,
  fetcher: async (page, pageSize) => {
    const res = await getCaseList({ page, page_size: pageSize })
    if (res.code !== 200) throw new Error(res.message || '加载失败')
    return {
      list: res.data,
      total: res.total ?? res.data.length,
    }
  },
})

onMounted(reload)

/** 打开上传弹层 */
function openUpload() {
  uploadVisible.value = true
}

/** 上传成功后刷新列表 */
async function onUploadSuccess() {
  showSuccessToast('案卷上传成功')
  await refresh()
}

/** 一键评查 → 评查流程页 */
function goReview(item: CaseRecord) {
  router.push({ name: 'review-process', params: { id: String(item.id) } })
}

/** 删除案卷 */
async function onDelete(item: CaseRecord) {
  await showConfirmDialog({
    title: '确认删除',
    message: `确定删除案卷「${item.party_name || item.organization_name}」吗？`,
  })
  const res = await deleteParseTask(item.id)
  if (res.code === 200) {
    showSuccessToast('删除成功')
    await refresh()
  } else {
    showToast(res.message || '删除失败')
  }
}
</script>

<template>
  <div class="case-panel">
    <ScrollLoadList
      :loading="loading"
      :refreshing="refreshing"
      :loading-more="loadingMore"
      :has-more="hasMore"
      @refresh="refresh"
      @load-more="loadMore"
    >
      <van-notice-bar v-if="!loading" left-icon="info-o" :scrollable="false" class="total-bar full-bleed">
        共 {{ total }} 条案卷
      </van-notice-bar>

      <van-empty v-if="!loading && list.length === 0" description="暂无案卷，请上传 PDF 案卷" class="full-bleed">
        <van-button round type="primary" class="empty-upload-btn" @click="openUpload">
          上传案卷
        </van-button>
      </van-empty>

      <article v-for="(item, index) in list" :key="item.id" class="case-card full-bleed">
        <header class="case-card-head">
          <span class="case-index">序号 {{ index + 1 }}</span>
        </header>

        <dl class="case-fields">
          <div class="field-row">
            <dt>处罚主体</dt>
            <dd>{{ item.organization_name || '—' }}</dd>
          </div>
          <div class="field-row">
            <dt>处罚文号</dt>
            <dd>{{ item.cfwh_no || '—' }}</dd>
          </div>
          <div class="field-row">
            <dt>立案号</dt>
            <dd>{{ item.lian_no || '—' }}</dd>
          </div>
          <div class="field-row">
            <dt>当事人</dt>
            <dd>{{ item.party_name || '—' }}</dd>
          </div>
          <div class="field-row">
            <dt>地址</dt>
            <dd>{{ item.address || '—' }}</dd>
          </div>
          <div class="field-row">
            <dt>法人</dt>
            <dd>{{ item.legal_person || '—' }}</dd>
          </div>
          <div class="field-row">
            <dt>上传时间</dt>
            <dd>{{ formatCaseCreatedAt(item.created_at) }}</dd>
          </div>
        </dl>

        <footer class="case-actions">
          <van-button size="small" round type="primary" plain @click="goReview(item)">
            一键评查
          </van-button>
          <van-button size="small" round type="danger" plain @click="onDelete(item)">
            删除
          </van-button>
        </footer>
      </article>
    </ScrollLoadList>

    <div class="upload-bar">
      <van-button block round type="primary" icon="plus" class="upload-btn" @click="openUpload">
        上传案卷
      </van-button>
    </div>

    <CaseUploadSheet v-model="uploadVisible" @success="onUploadSuccess" />
  </div>
</template>

<style scoped>
.case-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.total-bar {
  margin-bottom: var(--space-2);
  border-radius: var(--van-radius-md);
}

.empty-upload-btn {
  margin-top: var(--space-3);
  min-width: 140px;
}

.case-card {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
  margin-bottom: var(--space-2);
  overflow: hidden;
}

.case-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  background: #fafcff;
}

.case-index {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--primary);
}

.case-fields {
  margin: 0;
  padding: var(--space-2) var(--space-3);
}

.field-row {
  display: grid;
  grid-template-columns: 5.5em 1fr;
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

.case-actions {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3) var(--space-3);
  border-top: 1px solid var(--border);
}

.case-actions :deep(.van-button) {
  flex: 1;
  min-height: var(--touch-min);
}

.upload-bar {
  flex-shrink: 0;
  padding: var(--space-2) var(--page-margin-x) calc(var(--space-2) + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(to top, var(--bg) 70%, transparent);
}

.upload-btn {
  min-height: var(--touch-min);
  font-size: var(--font-md);
  font-weight: 600;
}
</style>
