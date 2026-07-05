<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'
import { resetPassword } from '@/api'
import { useUserStore } from '@/stores/user'

/** 弹框显隐（v-model） */
const visible = defineModel<boolean>({ default: false })

const router = useRouter()
const userStore = useUserStore()

/** 旧密码 */
const oldPassword = ref('')
/** 新密码 */
const newPassword = ref('')
/** 确认新密码 */
const confirmPassword = ref('')
/** 各字段是否明文显示 */
const showOld = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
/** 提交中 */
const submitting = ref(false)
/** 提示信息 */
const toastMsg = ref('')

/** 密码规则：8 位以上且包含字母与数字 */
const PASSWORD_REG = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

/** 关闭时清空表单 */
watch(visible, (v) => {
  if (!v) clearForm()
})

/** 过滤非法字符（对齐 Web ResetPassword 组件） */
function sanitizePassword(value: string): string {
  return value.replace(/[^a-zA-Z0-9!@#$%^&*(),.?":{}|<>]/g, '')
}

/** 输入旧密码 */
function onOldInput(e: Event) {
  oldPassword.value = sanitizePassword((e.target as HTMLInputElement).value)
}

/** 输入新密码 */
function onNewInput(e: Event) {
  newPassword.value = sanitizePassword((e.target as HTMLInputElement).value)
}

/** 输入确认密码 */
function onConfirmInput(e: Event) {
  confirmPassword.value = sanitizePassword((e.target as HTMLInputElement).value)
}

/** 重置表单 */
function clearForm() {
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  showOld.value = false
  showNew.value = false
  showConfirm.value = false
  toastMsg.value = ''
}

/** 关闭弹框 */
function onCancel() {
  visible.value = false
}

/** 校验并提交修改密码 */
async function onSubmit() {
  if (!oldPassword.value) {
    toastMsg.value = '请输入旧密码'
    return
  }
  if (!newPassword.value) {
    toastMsg.value = '请输入新密码'
    return
  }
  if (!PASSWORD_REG.test(newPassword.value)) {
    toastMsg.value = '密码需要8位以上英文+字母组合'
    return
  }
  if (oldPassword.value === newPassword.value) {
    toastMsg.value = '新密码和旧密码不能相同'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    toastMsg.value = '新密码和确认密码不一致'
    return
  }

  submitting.value = true
  toastMsg.value = ''
  try {
    const res = await resetPassword({
      old_password: oldPassword.value,
      new_password: newPassword.value,
    })
    if (res.code !== 200) {
      toastMsg.value = res.message || '密码修改失败'
      return
    }
    visible.value = false
    showSuccessToast('密码修改成功')
    userStore.logout()
    router.replace('/login')
  } catch (err) {
    toastMsg.value = err instanceof Error ? err.message : '密码修改失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="pwd-mask" @click.self="onCancel">
        <div class="pwd-dialog">
          <div class="dialog-header">
            <h2 class="dialog-title">修改密码</h2>
            <button type="button" class="close-btn" aria-label="关闭" @click="onCancel">✕</button>
          </div>

          <form class="dialog-body" @submit.prevent="onSubmit">
            <div class="field">
              <label class="field-label">
                旧密码
                <span class="field-hint">请输入8位以上数字+字母组合</span>
              </label>
              <div class="input-wrap">
                <input
                  :type="showOld ? 'text' : 'password'"
                  class="field-input"
                  placeholder="请输入旧密码"
                  autocomplete="current-password"
                  :value="oldPassword"
                  @input="onOldInput"
                />
                <button
                  type="button"
                  class="toggle-btn"
                  :aria-label="showOld ? '隐藏密码' : '显示密码'"
                  @click="showOld = !showOld"
                >
                  {{ showOld ? '隐藏' : '显示' }}
                </button>
              </div>
            </div>

            <div class="field">
              <label class="field-label">新密码</label>
              <div class="input-wrap">
                <input
                  :type="showNew ? 'text' : 'password'"
                  class="field-input"
                  placeholder="请输入新密码"
                  autocomplete="new-password"
                  :value="newPassword"
                  @input="onNewInput"
                />
                <button
                  type="button"
                  class="toggle-btn"
                  :aria-label="showNew ? '隐藏密码' : '显示密码'"
                  @click="showNew = !showNew"
                >
                  {{ showNew ? '隐藏' : '显示' }}
                </button>
              </div>
            </div>

            <div class="field">
              <label class="field-label">确认新密码</label>
              <div class="input-wrap">
                <input
                  :type="showConfirm ? 'text' : 'password'"
                  class="field-input"
                  placeholder="请再次输入新密码"
                  autocomplete="new-password"
                  :value="confirmPassword"
                  @input="onConfirmInput"
                />
                <button
                  type="button"
                  class="toggle-btn"
                  :aria-label="showConfirm ? '隐藏密码' : '显示密码'"
                  @click="showConfirm = !showConfirm"
                >
                  {{ showConfirm ? '隐藏' : '显示' }}
                </button>
              </div>
            </div>

            <p v-if="toastMsg" class="error-msg">{{ toastMsg }}</p>

            <button type="submit" class="submit-btn" :disabled="submitting">
              {{ submitting ? '提交中…' : '确定' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pwd-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.pwd-dialog {
  width: 100%;
  max-width: min(90vw, 400px);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 0;
}
.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}
.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
}
.dialog-body {
  padding: 16px;
}
.field {
  margin-bottom: 16px;
}
.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text);
}
.field-hint {
  display: block;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-top: 2px;
}
.input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.field-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 12px;
  font-size: 15px;
  min-height: var(--touch-min);
  background: transparent;
}
.toggle-btn {
  flex-shrink: 0;
  border: none;
  background: none;
  color: var(--primary);
  font-size: 13px;
  padding: 0 12px;
  cursor: pointer;
  min-height: var(--touch-min);
}
.error-msg {
  color: var(--danger);
  font-size: 13px;
  margin: -4px 0 12px;
}
.submit-btn {
  width: 100%;
  min-height: var(--touch-min);
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
