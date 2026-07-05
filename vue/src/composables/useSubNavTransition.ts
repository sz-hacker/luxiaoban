import { ref } from 'vue'

/** 子 Tab 切换动画方向 */
export type SubNavTransitionName = 'slide-left' | 'slide-right'

/** 子 Tab 内容区过渡动画名（供 SubNavSwipeView 使用） */
export const subNavTransitionName = ref<SubNavTransitionName>('slide-left')

/** 根据 Tab 索引差设置左右滑动画方向（点右 Tab → slide-left，点左 Tab → slide-right） */
export function setSubNavTransition(fromIndex: number, toIndex: number) {
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return
  subNavTransitionName.value = toIndex > fromIndex ? 'slide-left' : 'slide-right'
}
