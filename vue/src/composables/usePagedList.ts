import { ref, computed } from 'vue'

/** 分页请求返回结构 */
export interface PagedFetchResult<T> {
  list: T[]
  total: number
}

/**
 * 通用分页列表逻辑（对齐 PC task-todos/list 分页）
 * 支持下拉刷新、上拉加载更多
 */
export function usePagedList<T>(options: {
  pageSize?: number
  fetcher: (page: number, pageSize: number) => Promise<PagedFetchResult<T>>
}) {
  const pageSize = options.pageSize ?? 10

  const list = ref<T[]>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const loadingMore = ref(false)
  const refreshing = ref(false)

  /** 是否还有下一页 */
  const lastFetchSize = ref(0)

  const hasMore = computed(() => {
    if (total.value > 0) return list.value.length < total.value
    // API 未返回 total 时：上一页满页则继续加载
    return lastFetchSize.value >= pageSize
  })

  /** 拉取指定页并合并/覆盖列表 */
  async function fetchPage(targetPage: number, append: boolean) {
    const res = await options.fetcher(targetPage, pageSize)
    lastFetchSize.value = res.list.length
    list.value = append ? ([...list.value, ...res.list] as T[]) : res.list
    total.value = res.total
    page.value = targetPage
  }

  /** 首次/切换筛选加载 */
  async function reload() {
    loading.value = true
    try {
      await fetchPage(1, false)
    } finally {
      loading.value = false
    }
  }

  /** 下拉刷新：回到第一页 */
  async function refresh() {
    if (refreshing.value) return
    refreshing.value = true
    try {
      await fetchPage(1, false)
    } finally {
      refreshing.value = false
    }
  }

  /** 上拉加载下一页 */
  async function loadMore() {
    if (loading.value || loadingMore.value || refreshing.value || !hasMore.value) return
    loadingMore.value = true
    try {
      await fetchPage(page.value + 1, true)
    } finally {
      loadingMore.value = false
    }
  }

  return {
    list,
    total,
    page,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    reload,
    refresh,
    loadMore,
  }
}
