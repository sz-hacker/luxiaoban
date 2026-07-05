import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserInfo } from '@/api'
import type { LoginData } from '@/types/api'

/** 用户登录态 Store */
export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<LoginData | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  )

  const isLoggedIn = computed(() => !!token.value)

  /** 登录并持久化 token */
  async function login(username: string, password: string) {
    const res = await loginApi(username, password)
    if (res.code !== 200) throw new Error(res.message)
    token.value = res.data.access_token
    user.value = res.data
    localStorage.setItem('token', res.data.access_token)
    localStorage.setItem('user', JSON.stringify(res.data))
    return res.data
  }

  /** 刷新用户信息（接口不可用时保留本地缓存，避免未捕获 Promise 报错） */
  async function refreshUser() {
    try {
      const res = await getUserInfo()
      if (res.code === 200) {
        user.value = { ...user.value, ...res.data } as LoginData
        localStorage.setItem('user', JSON.stringify(user.value))
      }
    } catch {
      /* 测试环境可能无 /user/get_user_info，不影响主流程 */
    }
  }

  /** 更新本地头像（对齐 Web setUserInfo） */
  function setAvatar(avatar: string) {
    if (!user.value) return
    user.value = { ...user.value, avatar }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  /** 退出登录 */
  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isLoggedIn, login, refreshUser, setAvatar, logout }
})
