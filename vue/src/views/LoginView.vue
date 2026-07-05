<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { resolveAuthRedirect } from '@/router/constants'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const remember = ref(true)
const loading = ref(false)

onMounted(() => {
  if (userStore.isLoggedIn) {
    router.replace(resolveAuthRedirect(route.query.redirect))
  }
})

/** 提交登录 */
async function handleLogin() {
  if (!username.value || !password.value) {
    showToast('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(username.value, password.value)
    router.replace(resolveAuthRedirect(route.query.redirect))
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-brand">
      <van-icon name="description" size="48" color="#1677ff" />
      <h1 class="login-title">欢迎登录</h1>
      <p class="login-sub">速审 · 精判 · 立标</p>
    </div>

    <van-form @submit="handleLogin">
      <van-cell-group inset>
        <van-field
          v-model="username"
          name="username"
          label="账号"
          placeholder="请输入用户名"
          autocomplete="username"
          :rules="[{ required: true, message: '请输入用户名' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          autocomplete="current-password"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
      </van-cell-group>

      <div class="login-extra">
        <van-checkbox v-model="remember" icon-size="16px">记住我</van-checkbox>
      </div>

      <div class="login-actions">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          登录
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<style scoped>
.login-page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-5) var(--page-margin-x) var(--page-margin-bottom);
  background: linear-gradient(180deg, #e6f4ff, #f7f8fa);
}

.login-brand {
  text-align: center;
  margin-bottom: var(--space-5);
}

.login-title {
  font-size: var(--font-xl);
  font-weight: 700;
  margin: var(--space-3) 0 var(--space-1);
}

.login-sub {
  color: var(--van-gray-6);
  font-size: var(--font-sm);
}

.login-extra {
  padding: var(--space-3) var(--page-margin-x) 0;
}

.login-actions {
  padding: var(--space-4) var(--page-margin-x);
}
</style>
