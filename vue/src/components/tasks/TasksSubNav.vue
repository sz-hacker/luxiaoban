<script setup lang="ts">
import SubNavTabs from '@/components/layout/SubNavTabs.vue'
import { TASK_SUB_NAV_ITEMS } from '@/config/sub-nav'
</script>

<template>
  <SubNavTabs :items="TASK_SUB_NAV_ITEMS" />
</template>
