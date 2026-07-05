<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    refreshing?: boolean
    loadingMore?: boolean
    hasMore?: boolean
    showEndTip?: boolean
  }>(),
  {
    loading: false,
    refreshing: false,
    loadingMore: false,
    hasMore: false,
    showEndTip: false,
  },
)

const emit = defineEmits<{
  refresh: []
  'load-more': []
}>()

/** van-list 加载状态（双向绑定） */
const listLoading = ref(false)

/** 下拉刷新本地状态 */
const pullRefreshing = ref(false)

watch(
  () => props.refreshing,
  (val) => {
    if (!val) pullRefreshing.value = false
  },
)

watch(
  () => [props.loadingMore, props.loading] as const,
  ([more, init]) => {
    if (!more && !init) listLoading.value = false
  },
)

/** 下拉刷新 */
async function onRefresh() {
  pullRefreshing.value = true
  emit('refresh')
}

/** 上拉加载（Vant List 触底自动触发） */
function onLoad() {
  if (props.loading || props.refreshing || !props.hasMore) {
    listLoading.value = false
    return
  }
  listLoading.value = true
  emit('load-more')
}

/** 是否已全部加载 */
const finished = computed(() => !props.hasMore && !props.loading)
</script>

<template>
  <div class="scroll-load-list">
    <van-pull-refresh v-model="pullRefreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="listLoading"
        :finished="finished"
        :immediate-check="false"
        finished-text="已加载全部"
        @load="onLoad"
      >
        <slot />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<style scoped>
.scroll-load-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
