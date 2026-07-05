<script setup lang="ts">
/** Tab 图标名称 */
export type TabIconName = 'home' | 'cases' | 'ai' | 'tasks' | 'profile'

defineProps<{
  name: TabIconName
  active?: boolean
}>()
</script>

<template>
  <!-- 24×24 线性/面性图标，颜色继承 currentColor -->
  <svg
    class="tab-svg"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- 首页 -->
    <template v-if="name === 'home'">
      <path
        v-if="active"
        d="M12 3.2L4.5 9.8V19a1.2 1.2 0 001.2 1.2H9v-5.2h6V20.2h3.3A1.2 1.2 0 0019.5 19V9.8L12 3.2z"
        fill="currentColor"
      />
      <path
        v-else
        d="M4.5 9.8L12 3.2l7.5 6.6V19a1.2 1.2 0 01-1.2 1.2H15v-5.2H9V20.2H5.7A1.2 1.2 0 014.5 19V9.8z"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linejoin="round"
      />
    </template>

    <!-- 案卷 -->
    <template v-else-if="name === 'cases'">
      <path
        v-if="active"
        d="M8 2.8h6.8L19 6.8V20.2a1.2 1.2 0 01-1.2 1.2H8a1.2 1.2 0 01-1.2-1.2V4a1.2 1.2 0 011.2-1.2zM14 2.8v3.6h3.6"
        fill="currentColor"
        stroke="currentColor"
        stroke-width="0.5"
        stroke-linejoin="round"
      />
      <template v-else>
        <path
          d="M14 2.8H8A1.2 1.2 0 006.8 4v16.2A1.2 1.2 0 008 21.4h9.8a1.2 1.2 0 001.2-1.2V6.8L14 2.8z"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linejoin="round"
        />
        <path d="M14 2.8v3.6h3.6" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" />
      </template>
      <path
        d="M9.2 12h5.6M9.2 15h5.6M9.2 18h3.6"
        :stroke="active ? '#fff' : 'currentColor'"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </template>

    <!-- AI 助手 -->
    <template v-else-if="name === 'ai'">
      <path
        v-if="active"
        d="M12 2.5c-3.5 0-6.3 2.5-6.3 5.6 0 1.8.9 3.4 2.3 4.4L7.5 21.5l4.5-2.1 4.5 2.1-1.5-8.9c1.4-1 2.3-2.6 2.3-4.4 0-3.1-2.8-5.6-6.3-5.6z"
        fill="currentColor"
      />
      <path
        v-else
        d="M12 2.5c-3.5 0-6.3 2.5-6.3 5.6 0 1.8.9 3.4 2.3 4.4L7.5 21.5l4.5-2.1 4.5 2.1-1.5-8.9c1.4-1 2.3-2.6 2.3-4.4 0-3.1-2.8-5.6-6.3-5.6z"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linejoin="round"
      />
      <circle
        cx="9.5"
        cy="8.2"
        r="0.9"
        :fill="active ? '#fff' : 'currentColor'"
      />
      <circle
        cx="14.5"
        cy="8.2"
        r="0.9"
        :fill="active ? '#fff' : 'currentColor'"
      />
      <path
        d="M10 10.8c.6.8 1.5 1.2 2 1.2s1.4-.4 2-1.2"
        :stroke="active ? '#fff' : 'currentColor'"
        stroke-width="1.4"
        stroke-linecap="round"
        fill="none"
      />
    </template>

    <!-- 任务 -->
    <template v-else-if="name === 'tasks'">
      <path
        v-if="active"
        d="M7 2.8h10a1.8 1.8 0 011.8 1.8v15.4A1.8 1.8 0 0117 21.8H7a1.8 1.8 0 01-1.8-1.8V4.6A1.8 1.8 0 017 2.8z"
        fill="currentColor"
      />
      <rect
        v-else
        x="5.2"
        y="2.8"
        width="13.6"
        height="19"
        rx="1.8"
        stroke="currentColor"
        stroke-width="1.75"
      />
      <path
        d="M9.2 12.2l1.8 1.8 3.8-3.8"
        :stroke="active ? '#fff' : 'currentColor'"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <path
        d="M9.2 17.2h5.6"
        :stroke="active ? '#fff' : 'currentColor'"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </template>

    <!-- 我的 -->
    <template v-else-if="name === 'profile'">
      <path
        v-if="active"
        d="M12 12.5a4.2 4.2 0 100-8.4 4.2 4.2 0 000 8.4zM5.5 20.5a6.5 6.5 0 0113 0H5.5z"
        fill="currentColor"
        fill-rule="evenodd"
        clip-rule="evenodd"
      />
      <template v-else>
        <circle cx="12" cy="8.3" r="4.2" stroke="currentColor" stroke-width="1.75" />
        <path
          d="M5.5 20.5a6.5 6.5 0 0113 0"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
        />
      </template>
    </template>
  </svg>
</template>

<style scoped>
.tab-svg {
  width: 22px;
  height: 22px;
  display: block;
}
</style>
