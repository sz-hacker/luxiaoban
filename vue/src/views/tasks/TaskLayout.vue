<script setup lang="ts">
import PageShell from '@/components/layout/PageShell.vue'
import TasksSubNav from '@/components/tasks/TasksSubNav.vue'
import SubNavSwipeView from '@/components/layout/SubNavSwipeView.vue'
import { TASK_SUB_NAV_ITEMS } from '@/config/sub-nav'
</script>

<template>
  <PageShell inner-scroll>
    <TasksSubNav />
    <SubNavSwipeView :items="TASK_SUB_NAV_ITEMS" />
  </PageShell>
</template>
