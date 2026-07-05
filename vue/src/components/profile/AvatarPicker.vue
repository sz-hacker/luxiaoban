<script setup lang="ts">
import { ref, computed } from 'vue'
import { showFailToast, showLoadingToast, showSuccessToast, closeToast } from 'vant'
import { changeAvatar, uploadAvatarFile } from '@/api'
import { useUserStore } from '@/stores/user'

/** 默认头像（与 Web 端一致） */
const DEFAULT_AVATAR = 'https://luban.bj.bcebos.com/v1/image/header/hbdefaultheader.jpg'

const userStore = useUserStore()

/** 隐藏的文件选择器 */
const fileInputRef = ref<HTMLInputElement | null>(null)
/** 上传中，防止重复触发 */
const uploading = ref(false)

/** 当前展示头像 */
const avatarSrc = computed(() => userStore.user?.avatar || DEFAULT_AVATAR)

/** 点击头像，唤起相册/相机选择（移动端 H5 简化裁剪流程，直接上传） */
function onAvatarClick() {
  if (uploading.value) return
  fileInputRef.value?.click()
}

/**
 * 校验图片格式（对齐 Web before-upload）
 * @param file 用户选中的文件
 */
function validateImageFile(file: File): boolean {
  if (!file.type.startsWith('image/')) {
    showFailToast('文件格式错误，请上传 JPG、PNG 等图片文件')
    return false
  }
  return true
}

/** 处理选中图片：upload/one + change-avatar */
async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !validateImageFile(file)) return

  uploading.value = true
  showLoadingToast({ message: '上传中…', forbidClick: true, duration: 0 })
  try {
    const uploadRes = await uploadAvatarFile(file)
    if (uploadRes.code !== 200) {
      throw new Error(uploadRes.message || '上传失败')
    }

    const avatarUrl = uploadRes.data.url || uploadRes.data.file_url
    const changeRes = await changeAvatar({ avatar: avatarUrl })
    if (changeRes.code !== 200) {
      throw new Error(changeRes.message || '头像修改失败')
    }

    userStore.setAvatar(avatarUrl)
    showSuccessToast('修改成功')
  } catch (err) {
    showFailToast(err instanceof Error ? err.message : '头像修改失败')
  } finally {
    closeToast()
    uploading.value = false
  }
}
</script>

<template>
  <button type="button" class="avatar-picker" aria-label="点击修改头像" @click="onAvatarClick">
    <van-image round width="64" height="64" :src="avatarSrc" />
    <span class="avatar-badge" aria-hidden="true">
      <van-icon name="photograph" size="14" color="#fff" />
    </span>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/jpg,image/webp"
      class="avatar-input"
      @change="onFileChange"
    />
  </button>
</template>

<style scoped>
.avatar-picker {
  position: relative;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.avatar-input {
  display: none;
}

.avatar-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--van-primary-color, #1677ff);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}
</style>
