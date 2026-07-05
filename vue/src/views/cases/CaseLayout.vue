<script setup lang="ts">
import PageShell from '@/components/layout/PageShell.vue'
import CasesSubNav from '@/components/cases/CasesSubNav.vue'
import SubNavSwipeView from '@/components/layout/SubNavSwipeView.vue'
import { CASE_SUB_NAV_ITEMS } from '@/config/sub-nav'
</script>

<template>
  <PageShell inner-scroll>
    <CasesSubNav />
    <SubNavSwipeView :items="CASE_SUB_NAV_ITEMS" />
  </PageShell>
</template>
