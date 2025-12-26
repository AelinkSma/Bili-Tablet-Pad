import { onMounted, onActivated, nextTick, watch } from 'vue' // ✨ 新增 onActivated
import { useAppStore } from '@/stores/app'

/**
 * 自动光标聚焦 Hook
 * @param {Function | String} getTargetId - 返回目标元素ID的函数，或者直接是ID字符串
 * @param {Ref | Function} watchSource - (可选) 需要监听的数据源(如 list 数组)，数据变了会自动重新聚焦
 */
export function useAutoCursor(getTargetId, watchSource = null) {
  const appStore = useAppStore()

  const triggerMove = () => {
    nextTick(() => {
      // 稍微延迟，确保路由转场动画(slide-fade)基本结束，元素位置稳定
      setTimeout(() => {
        const id = typeof getTargetId === 'function' ? getTargetId() : getTargetId
        
        // 只有当 ID 存在且屏幕上真的有这个元素时，才移动
        if (id && document.getElementById(id)) {
          // console.log(`Hook 触发自动聚焦: ${id}`)
          appStore.cursorMoveRequest = { 
            targetId: id, 
            timestamp: Date.now() 
          }
        }
      }, 100) // ⚡️ 建议稍微改大一点点延迟，配合 CSS 动画时间
    })
  }

  // 1. 组件首次挂载时触发
  onMounted(() => {
    triggerMove()
  })

  // 2. ✨ 核心修复：组件从缓存被激活时触发 (KeepAlive)
  onActivated(() => {
    triggerMove()
  })

  // 3. 数据变化时触发
  if (watchSource) {
    watch(watchSource, (newVal) => {
      // 只有当列表有数据时才触发，防止空列表报错
      if (newVal && (Array.isArray(newVal) ? newVal.length > 0 : true)) {
        triggerMove()
      }
    }, { deep: true })
  }
}