/**
 * 水平滑动手势：用于子 Tab 左右切换
 * 垂直滚动占优时自动取消，避免与列表滚动冲突
 */
export function useHorizontalSwipe(options: {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  /** 最小滑动距离（px） */
  threshold?: number
}) {
  const threshold = options.threshold ?? 56
  let startX = 0
  let startY = 0
  /** 是否仍在跟踪本次手势 */
  let tracking = false

  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return
    startX = touch.clientX
    startY = touch.clientY
    tracking = true
  }

  function onTouchMove(e: TouchEvent) {
    if (!tracking) return
    const touch = e.touches[0]
    if (!touch) return
    const dx = touch.clientX - startX
    const dy = touch.clientY - startY
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
      tracking = false
    }
  }

  function onTouchEnd(e: TouchEvent) {
    if (!tracking) return
    tracking = false
    const touch = e.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - startX
    const dy = touch.clientY - startY
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) options.onSwipeLeft()
    else options.onSwipeRight()
  }

  return { onTouchStart, onTouchMove, onTouchEnd }
}
