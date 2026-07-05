<script setup lang="ts">
import SubNavTabs from '@/components/layout/SubNavTabs.vue'
import { CASE_SUB_NAV_ITEMS } from '@/config/sub-nav'
</script>

<template>
  <SubNavTabs :items="CASE_SUB_NAV_ITEMS" />
</template>
