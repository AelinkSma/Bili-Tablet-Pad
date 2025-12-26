<template>
  <div class="uni-grid-wrapper">
    <div class="grid-header" v-if="$slots.header">
      <slot name="header"></slot>
    </div>

    <div 
      class="grid-container" 
      :class="{ 'low-perf': lowPerfMode }" 
      ref="gridContainerRef"
      :style="{ 'grid-template-columns': `repeat(${columns}, 1fr)` }"
    >
      <div 
        v-for="(item, index) in list" 
        :key="item.bvid || item.aid || index"
        :id="`${idPrefix}-${index}`" 
        class="video-card target-box"
        :class="{ 'card-low-perf': lowPerfMode }"
        @click="handleClick(item)"
      >
        <div class="cover-box">
          <BiliImage 
            :src="getOptimizedUrl(item.pic)" 
            class="cover" 
            fit="cover" 
          />
          
          <div class="stat-badge" v-if="!lowPerfMode">
             <span class="stat-text">▶ {{ formatNum(item.stat?.view || item.play) }}</span>
             <span class="stat-text">{{ formatDuration(item.duration) }}</span>
          </div>
          <div class="stat-badge-simple" v-else>
             <span>{{ formatDuration(item.duration) }}</span>
          </div>
        </div>

        <div class="info">
          <!-- 🔥 修复：使用 v-html 解析 em 标签，移除 title 属性防止显示原始字符串 -->
          <div class="title" v-html="item.title"></div>
          <div class="up-name">UP {{ item.owner?.name || item.author }}</div>
        </div>
      </div>
      
      <div 
        v-if="!loading && list.length > 0"
        class="load-more-capsule target-box"
        :class="{ 'is-loading': isLoadingMore }"
        :style="{ 'grid-column': `span ${columns}` }"
        @mouseenter="handleLoadMoreHover"
        @click="triggerLoadMore"
      >
        <div v-if="isLoadingMore" class="spinner-mini"></div>
        <span v-else>加载更多内容</span>
      </div>

      <div v-if="loading && list.length === 0" class="loading-state" :style="{ 'grid-column': `span ${columns}` }">
        <div class="spinner"></div>
      </div>
      <div v-else-if="!loading && list.length === 0" class="empty-tip" :style="{ 'grid-column': `span ${columns}` }">
        暂无数据
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch, nextTick, onUnmounted } from 'vue'
import BiliImage from '@/组件/小组件/BiliImage.vue'
import { useAutoCursor } from '@/hooks/useAutoCursor'
import { useSettingsStore } from '@/stores/settings'
import { useAppStore } from '@/stores/app'

const props = defineProps({
  list: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  idPrefix: { type: String, required: true },
  lowPerfMode: { type: Boolean, default: false },
  // 🔥 新增：列数控制 (默认为 2)
  columns: { type: Number, default: 2 }
})

const emit = defineEmits(['click-video', 'load-more'])
const settingsStore = useSettingsStore()
const appStore = useAppStore()

const gridContainerRef = ref(null)
const isLoadingMore = ref(false)
let debounceTimer = null
let safetyTimer = null
let preLoadLength = 0 

// 🔥 核心修改 1: 传入 null 禁用 Hook 内部的自动监听
// 我们将在下方的 watch 中手动接管光标逻辑，避免竞态冲突
useAutoCursor(() => {
  return `${props.idPrefix}-0`
}, null) 

const handleClick = (item) => {
  emit('click-video', item)
}

const triggerLoadMore = () => {
  if (isLoadingMore.value) return
  isLoadingMore.value = true
  preLoadLength = props.list.length 
  emit('load-more')
  
  // 安全措施：防止按钮卡死
  clearTimeout(safetyTimer)
  safetyTimer = setTimeout(() => {
    if (isLoadingMore.value) {
      isLoadingMore.value = false
    }
  }, 8000)
}

const handleLoadMoreHover = () => {
  if (isLoadingMore.value) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    triggerLoadMore()
  }, 300)
}

onUnmounted(() => {
  clearTimeout(debounceTimer)
  clearTimeout(safetyTimer)
})

// --- 🔥 核心修改 2: 全权接管列表变化的副作用 ---
watch(() => props.list, (newList, oldList) => {
  clearTimeout(safetyTimer)

  // 场景 A: 无限加载触发的更新 (Append / Shift)
  if (isLoadingMore.value) {
    const step = settingsStore.videoLoadCount
    // 判断是否发生了头部删除 (Shift Mode)
    // 依据：列表都不为空，且第一条数据的 ID 变了
    const isShiftMode = oldList.length > 0 && newList.length > 0 && oldList[0].bvid !== newList[0].bvid

    // 1. 滚动锚定计算
    let anchorEl = null
    let oldRectTop = 0
    if (isShiftMode) {
      const anchorIndex = step 
      anchorEl = document.getElementById(`${props.idPrefix}-${anchorIndex}`)
      if (anchorEl) oldRectTop = anchorEl.getBoundingClientRect().top
    }

    // 等待 DOM 更新
    nextTick(() => {
      const scrollContainer = gridContainerRef.value?.closest('.scroll-wrapper') || gridContainerRef.value?.parentElement

      // 执行滚动补偿
      if (isShiftMode && anchorEl && scrollContainer) {
        const newAnchorEl = document.getElementById(`${props.idPrefix}-0`)
        if (newAnchorEl) {
          const newRectTop = newAnchorEl.getBoundingClientRect().top
          const diff = newRectTop - oldRectTop
          if (Math.abs(diff) > 5) scrollContainer.scrollTop += diff
        }
      }

      // 🔥 光标定位逻辑
      let targetIndex = 0
      if (isShiftMode) {
        // 如果发生了移位，新数据通常位于列表后半部分
        // 公式：总长度 - 步长 (例如 40 - 20 = 20)
        targetIndex = Math.max(0, newList.length - step)
      } else {
        // 纯追加模式，光标跳到原来的末尾 (即新数据的开头)
        targetIndex = preLoadLength
      }
      
      setTimeout(() => {
         appStore.cursorMoveRequest = { 
          targetId: `${props.idPrefix}-${targetIndex}`, 
          timestamp: Date.now() 
        }
      }, 50)

      isLoadingMore.value = false
    })
  } 
  // 场景 B: 普通刷新 (切换分类 / 刷新页面)
  else {
    // 这就是原本 useAutoCursor 做的事情，现在我们手动做
    // 只有当列表有数据时才归位到 0
    if (newList.length > 0) {
      nextTick(() => {
         // 稍微延迟，等待 Transition 动画
         setTimeout(() => {
           appStore.cursorMoveRequest = { 
            targetId: `${props.idPrefix}-0`, 
            timestamp: Date.now() 
          }
         }, 100)
      })
    }
  }

}, { flush: 'pre' }) // pre 模式用于获取更新前的 DOM

const getOptimizedUrl = (url) => {
  if (!url) return ''
  if (url.includes('@')) return url
  return `${url}@320w_200h_1c.webp`
}
const formatNum = (num) => num > 10000 ? (num / 10000).toFixed(1) + '万' : (num || '0')
const formatDuration = (val) => {
  if (!val) return '00:00'
  
  // 1. 如果是 "03:20" 这种字符串格式，直接返回
  if (typeof val === 'string' && val.includes(':')) return val
  
  // 2. 如果是数字（秒数），格式化
  const seconds = parseInt(val)
  if (isNaN(seconds)) return '00:00'
  
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<style scoped>
/* 样式保持不变 */
.uni-grid-wrapper { 
  display: flex; 
  flex-direction: column; 
  padding-bottom: 20px; 
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
}
.uni-grid-wrapper::-webkit-scrollbar {
  display: none;
}
.grid-header { padding: 12px 16px 8px 16px; flex-shrink: 0; }
.grid-container { display: grid; gap: 10px; padding: 0 12px; }
.video-card { display: flex; flex-direction: column; border-radius: 8px; overflow: hidden; cursor: pointer; background: var(--bg-glass); transition: transform 0.1s; will-change: transform; }
.video-card:active { transform: scale(0.96); }
.video-card.card-low-perf { background: var(--bg-surface); box-shadow: 0 1px 2px var(--shadow-base); backdrop-filter: none !important; }
.cover-box { position: relative; width: 100%; aspect-ratio: 16/9; background: var(--border-base); border-radius: 6px; overflow: hidden; }
.stat-badge { position: absolute; bottom: 4px; right: 4px; left: 4px; display: flex; justify-content: space-between; pointer-events: none; }
.stat-text { color: #fff; font-size: 9px; padding: 1px 4px; border-radius: 4px; background: rgba(0, 0, 0, 0.5); }
.stat-badge-simple { position: absolute; bottom: 4px; right: 4px; color: #fff; font-size: 9px; padding: 1px 4px; border-radius: 4px; background: rgba(0, 0, 0, 0.7); }
.info { padding: 6px 8px; display: flex; flex-direction: column; gap: 3px; }
.title { font-size: 12px; font-weight: 600; color: var(--text-main); line-height: 1.35; height: 2.7em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
/* 🔥 修复：为 v-html 渲染的关键词添加高亮样式 */
.title :deep(em.keyword) { font-style: normal; color: #fb7299; }
.up-name { font-size: 10px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.loading-state { grid-column: span 2; display: flex; justify-content: center; padding: 20px; }
.spinner { width: 24px; height: 24px; border: 3px solid var(--border-base); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-tip { grid-column: span 2; text-align: center; padding: 40px; color: var(--text-muted); font-size: 13px; }
.load-more-capsule { grid-column: span 2; height: 48px; margin: 10px 20px 30px 20px; background: var(--bg-glass); border: 1px solid var(--border-base); border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: var(--text-sub); cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px var(--shadow-base); }
.load-more-capsule:hover { background: var(--bg-surface); color: var(--primary-color); transform: scale(1.02); }
.load-more-capsule.is-loading { opacity: 0.8; pointer-events: none; }
.spinner-mini { width: 16px; height: 16px; border: 2px solid var(--text-muted); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 0.8s linear infinite; }
</style>