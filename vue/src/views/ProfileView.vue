<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog } from 'vant'
import { useUserStore } from '@/stores/user'
import PageShell from '@/components/layout/PageShell.vue'
import AvatarPicker from '@/components/profile/AvatarPicker.vue'
import ResetPasswordDialog from '@/components/profile/ResetPasswordDialog.vue'

const router = useRouter()
const userStore = useUserStore()

/** 修改密码弹框显隐 */
const showResetPassword = ref(false)

onMounted(() => {
  userStore.refreshUser()
})

/** 打开修改密码弹框 */
function openResetPassword() {
  showResetPassword.value = true
}

/** 退出登录 */
async function logout() {
  await showConfirmDialog({ title: '确认退出登录？', message: '确定注销并退出系统吗？' })
  userStore.logout()
  router.replace('/login')
}
</script>

<template>
  <PageShell title="我的">
    <div class="profile-header full-bleed">
      <AvatarPicker />
      <div class="profile-info">
        <div class="name">{{ userStore.user?.name || '未登录' }}</div>
        <div class="username">{{ userStore.user?.username }}</div>
      </div>
    </div>

    <van-cell-group class="menu-group full-bleed">
      <van-cell title="修改密码" is-link icon="lock" @click="openResetPassword" />
      <van-cell
        title="退出登录"
        is-link
        icon="warning-o"
        title-style="color: #ee0a24"
        @click="logout"
      />
    </van-cell-group>

    <van-cell-group class="about-group full-bleed">
      <van-cell title="智能案卷评查系统" label="AI驱动 · 速审精判 · 移动版 v1.0" center />
    </van-cell-group>

    <ResetPasswordDialog v-model="showResetPassword" />
  </PageShell>
</template>

<style scoped>
.profile-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--page-margin-x);
  margin-bottom: var(--space-3);
  background: #fff;
}

.name {
  font-size: var(--font-lg);
  font-weight: 600;
}

.username {
  font-size: var(--font-sm);
  color: var(--van-gray-6);
  margin-top: var(--space-1);
}

.menu-group,
.about-group {
  margin-bottom: var(--space-3);
}
</style>
