<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { addTask, updateTask, getAccountsList } from '@/api'
import {
  TASK_CYCLE_OPTIONS,
  TASK_TYPE_OPTIONS,
} from '@/utils/taskTemplate'
import { formatTaskEndDate } from '@/utils/task'
import type { AccountRecord, TaskRecord } from '@/types/api'

const props = defineProps<{
  show: boolean
  /** add 新建 / edit 编辑 */
  mode: 'add' | 'edit'
  /** 编辑时传入的行数据 */
  record?: TaskRecord | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  success: []
}>()

/** 表单字段（对齐 Web add-dialog） */
const form = ref({
  title: '',
  company_name: '',
  content: '',
  task_type: '' as '' | 'personal' | 'department' | 'general',
  user_id: null as number | null,
  cycle_period: null as number | null,
  /** 毫秒时间戳区间，供 van-calendar 使用 */
  dateRange: [] as Date[],
})

const submitting = ref(false)
const accounts = ref<AccountRecord[]>([])

/** 各 Picker 弹层显隐 */
const showTypePicker = ref(false)
const showUserPicker = ref(false)
const showCyclePicker = ref(false)
const showCalendar = ref(false)

/** 弹层标题 */
const popupTitle = computed(() => (props.mode === 'add' ? '新增监测任务' : '修改监测任务'))

/** 任务类型 Picker 列 */
const typeColumns = TASK_TYPE_OPTIONS.map((item) => ({ text: item.label, value: item.value }))

/** 任务周期 Picker 列 */
const cycleColumns = TASK_CYCLE_OPTIONS.map((item) => ({ text: item.label, value: item.value }))

/** 经办人 Picker 列 */
const userColumns = computed(() =>
  accounts.value.map((item) => ({
    text: `${item.name}-${item.username}`,
    value: item.id,
  })),
)

/** 任务类型展示文案 */
const typeLabel = computed(() => {
  if (!form.value.task_type) return ''
  return TASK_TYPE_OPTIONS.find((item) => item.value === form.value.task_type)?.label ?? ''
})

/** 任务周期展示文案 */
const cycleLabel = computed(() => {
  if (form.value.cycle_period == null) return ''
  return TASK_CYCLE_OPTIONS.find((item) => item.value === form.value.cycle_period)?.label ?? ''
})

/** 经办人展示文案 */
const userLabel = computed(() => {
  const user = accounts.value.find((item) => item.id === form.value.user_id)
  return user ? `${user.name}-${user.username}` : ''
})

/** 任务时间展示文案 */
const dateRangeLabel = computed(() => {
  const [start, end] = form.value.dateRange
  if (!start || !end) return ''
  const toSec = (d: Date) => Math.floor(d.getTime() / 1000)
  return `${formatTaskEndDate(toSec(start))} ~ ${formatTaskEndDate(toSec(end))}`
})

/** 加载经办人列表 */
async function loadAccounts() {
  const res = await getAccountsList(1, 99)
  if (res.code === 200) accounts.value = res.data ?? []
}

/** 重置表单为空 */
function resetForm() {
  form.value = {
    title: '',
    company_name: '',
    content: '',
    task_type: '',
    user_id: null,
    cycle_period: null,
    dateRange: [],
  }
}

/** 编辑模式：用行数据填充表单 */
function fillFormFromRecord(record: TaskRecord) {
  form.value = {
    title: record.title,
    company_name: record.company_name,
    content: record.content,
    task_type: record.task_type as 'personal' | 'department' | 'general',
    user_id: record.user_id,
    cycle_period: record.cycle_period,
    dateRange: [
      new Date(record.start_time * 1000),
      new Date(record.end_time * 1000),
    ],
  }
}

/** 关闭弹层 */
function closePopup() {
  emit('update:show', false)
}

/** 校验表单 */
function validateForm(): boolean {
  const f = form.value
  if (!f.title.trim()) {
    showFailToast('请输入任务来源')
    return false
  }
  if (!f.company_name.trim()) {
    showFailToast('请输入企业名称')
    return false
  }
  if (!f.content.trim()) {
    showFailToast('请输入任务内容')
    return false
  }
  if (!f.task_type) {
    showFailToast('请选择任务类型')
    return false
  }
  if (!f.user_id) {
    showFailToast('请选择经办人')
    return false
  }
  if (f.cycle_period == null) {
    showFailToast('请选择任务周期')
    return false
  }
  if (f.dateRange.length < 2) {
    showFailToast('请选择任务时间')
    return false
  }
  return true
}

/** 提交新建/编辑 */
async function onSubmit() {
  if (submitting.value || !validateForm()) return

  const [startDate, endDate] = form.value.dateRange
  if (!startDate || !endDate) return

  const payload = {
    title: form.value.title.trim(),
    company_name: form.value.company_name.trim(),
    content: form.value.content.trim(),
    task_type: form.value.task_type as 'personal' | 'department' | 'general',
    user_id: form.value.user_id!,
    cycle_period: form.value.cycle_period!,
    start_time: Math.floor(startDate.getTime() / 1000),
    end_time: Math.floor(endDate.getTime() / 1000),
  }

  submitting.value = true
  try {
    const res =
      props.mode === 'add'
        ? await addTask(payload)
        : await updateTask({ ...payload, id: props.record!.id })

    if (res.code !== 200) {
      showFailToast(res.message || '提交失败')
      return
    }
    showSuccessToast('提交成功')
    closePopup()
    emit('success')
  } catch (err) {
    console.error('任务表单提交失败:', err)
    showFailToast(err instanceof Error ? err.message : '提交失败')
  } finally {
    submitting.value = false
  }
}

/** Picker 确认回调 */
function onTypeConfirm({ selectedOptions }: { selectedOptions: { value: string }[] }) {
  form.value.task_type = selectedOptions[0]?.value as typeof form.value.task_type
  showTypePicker.value = false
}

function onUserConfirm({ selectedOptions }: { selectedOptions: { value: number }[] }) {
  form.value.user_id = selectedOptions[0]?.value ?? null
  showUserPicker.value = false
}

function onCycleConfirm({ selectedOptions }: { selectedOptions: { value: number }[] }) {
  form.value.cycle_period = selectedOptions[0]?.value ?? null
  showCyclePicker.value = false
}

/** 日历区间确认：van-calendar confirm 返回 Date[] */
function onCalendarConfirm(dates: Date[]) {
  form.value.dateRange = dates
  showCalendar.value = false
}

watch(
  () => props.show,
  async (visible) => {
    if (!visible) return
    await loadAccounts()
    if (props.mode === 'edit' && props.record) {
      fillFormFromRecord(props.record)
    } else {
      resetForm()
    }
  },
)
</script>

<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    class="task-form-popup"
    :style="{ height: '92%' }"
    @update:show="emit('update:show', $event)"
  >
    <div class="form-shell">
      <header class="form-header">
        <h3 class="form-title">{{ popupTitle }}</h3>
        <van-icon name="cross" class="close-icon" @click="closePopup" />
      </header>

      <van-form class="form-body" @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.title"
            label="任务来源"
            placeholder="请输入任务来源"
            maxlength="100"
            required
          />
          <van-field
            v-model="form.company_name"
            label="企业名称"
            placeholder="请输入企业名称"
            maxlength="100"
            required
          />
          <van-field
            v-model="form.content"
            label="任务内容"
            type="textarea"
            rows="2"
            placeholder="请输入任务内容"
            maxlength="100"
            required
          />
          <van-field
            :model-value="typeLabel"
            label="任务类型"
            placeholder="请选择任务类型"
            readonly
            is-link
            required
            @click="showTypePicker = true"
          />
          <van-field
            :model-value="userLabel"
            label="经办人"
            placeholder="请选择经办人"
            readonly
            is-link
            required
            @click="showUserPicker = true"
          />
          <van-field
            :model-value="cycleLabel"
            label="任务周期"
            placeholder="请选择任务周期"
            readonly
            is-link
            required
            @click="showCyclePicker = true"
          />
          <van-field
            :model-value="dateRangeLabel"
            label="任务时间"
            placeholder="请选择开始和结束日期"
            readonly
            is-link
            required
            @click="showCalendar = true"
          />
        </van-cell-group>

        <div class="form-actions">
          <van-button round plain type="primary" class="form-btn" @click="closePopup">
            取消
          </van-button>
          <van-button
            round
            type="primary"
            native-type="submit"
            class="form-btn"
            :loading="submitting"
          >
            {{ mode === 'add' ? '添加' : '确定' }}
          </van-button>
        </div>
      </van-form>
    </div>

    <van-popup v-model:show="showTypePicker" position="bottom" round>
      <van-picker :columns="typeColumns" @confirm="onTypeConfirm" @cancel="showTypePicker = false" />
    </van-popup>

    <van-popup v-model:show="showUserPicker" position="bottom" round>
      <van-picker :columns="userColumns" @confirm="onUserConfirm" @cancel="showUserPicker = false" />
    </van-popup>

    <van-popup v-model:show="showCyclePicker" position="bottom" round>
      <van-picker :columns="cycleColumns" @confirm="onCycleConfirm" @cancel="showCyclePicker = false" />
    </van-popup>

    <van-calendar
      v-model:show="showCalendar"
      type="range"
      :default-date="form.dateRange.length ? form.dateRange : undefined"
      @confirm="onCalendarConfirm"
    />
  </van-popup>
</template>

<style scoped>
.task-form-popup {
  display: flex;
  flex-direction: column;
}

.form-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--page-margin-x);
  border-bottom: 1px solid var(--border);
}

.form-title {
  margin: 0;
  font-size: var(--font-md);
  font-weight: 600;
}

.close-icon {
  font-size: 20px;
  color: var(--text-secondary);
  padding: var(--space-1);
}

.form-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) 0 var(--space-3);
}

.form-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
  padding: var(--space-3) var(--page-margin-x) 0;
}

.form-btn {
  min-height: var(--touch-min);
}
</style>
