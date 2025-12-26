<template>
  <div class="list-wrapper">
    <div class="list-header">
      <div class="back-btn target-box" @click="appStore.goBack()">
        <span class="icon">⬅</span>
      </div>
      <div class="title">{{ title }} · 动态</div>
    </div>

    <UniversalVideoGrid
      class="flex-grid"
      :list="list"
      :loading="loading"
      id-prefix="cat-video"
      :low-perf-mode="settingsStore.lowPerformanceMode"
      @click-video="handleVideoClick"
      @load-more="handleLoadMore"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getRegionVideos } from '@/api/modules/video'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import UniversalVideoGrid from '@/组件/小组件/UniversalVideoGrid.vue'
import { defineProps } from 'vue'

const props = defineProps({
  rid: { type: [String, Number], required: true },
  title: { type: String, default: '分区' }
})

const appStore = useAppStore()
const settingsStore = useSettingsStore()

const list = ref([])
const loading = ref(true)
const page = ref(1) // ✨ 新增：记录当前页码
const BILI_API_PAGE_SIZE = 20 

// 🚀 改造版：支持追加模式 (Infinite Scroll)
const fetchData = async (append = false) => {
  // 1. 初始化状态
  if (!append) {
    loading.value = true
    list.value = [] // 视觉清空
    page.value = 1  // 重置页码
  }
  
  const targetCount = settingsStore.videoLoadCount || 60
  let collected = []
  
  console.log(`📦 [分区] rid:${props.rid} 开始加载: 目标 ${targetCount}, 模式: ${append ? '追加' : '覆盖'}, 当前页: ${page.value}`)

  try {
    // 2. 循环请求直到攒够数据
    while (collected.length < targetCount) {
      const res = await getRegionVideos(props.rid, page.value, BILI_API_PAGE_SIZE)
      
      if (res.code === 0) {
        // 兼容 archives 或 list 字段
        const newItems = res.data.archives || res.data.list || []
        
        if (newItems.length === 0) break 
        
        // 去重逻辑 (防止 API 翻页重复 + 防止追加时重复)
        const currentIds = new Set(list.value.map(i => i.bvid))
        const collectedIds = new Set(collected.map(i => i.bvid))
        
        for (const item of newItems) {
           if (!currentIds.has(item.bvid) && !collectedIds.has(item.bvid)) {
             collected.push(item)
           }
        }

        page.value++ // 页码自增

        if (newItems.length < BILI_API_PAGE_SIZE) break // 数据耗尽
      } else {
        console.warn('分区数据请求异常:', res)
        break
      }
    }

    const finalNewItems = collected.slice(0, targetCount)

    // 3. ✨ 原子化更新 (Copy from app.js)
    if (append) {
      // 构造完整新数组
      let nextList = [...list.value, ...finalNewItems]
      
      // 滑动窗口裁剪
      const MAX_SIZE = targetCount * 2
      if (nextList.length > MAX_SIZE) {
        const removeCount = nextList.length - MAX_SIZE
        console.log(`🧹 [分区] 滑动窗口: 删除头部 ${removeCount} 条`)
        nextList = nextList.slice(removeCount)
      }
      
      // 一次性赋值，触发 UniversalVideoGrid 的 watch
      list.value = nextList
    } else {
      list.value = finalNewItems
    }

  } catch (e) {
    console.error('Fetch region failed', e)
  } finally {
    loading.value = false
  }
}

const handleVideoClick = (item) => {
  appStore.playVideo(item)
}

// ✨ 处理加载更多事件
const handleLoadMore = () => {
  fetchData(true) // true = append mode
}

// 监听分区ID变化 (切分区时，重置并覆盖加载)
watch(() => props.rid, () => fetchData(false))

// 组件挂载时获取
onMounted(() => { fetchData(false) })
</script>

<style scoped>
/* 样式保持不变 */
.list-wrapper { display: flex; flex-direction: column; height: 100%; } /* 确保高度撑满 */
.list-header { padding: 12px 16px; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

.back-btn { 
  width: 32px; height: 32px; 
  border-radius: 50%; 
  background: var(--bg-glass); 
  display: flex; align-items: center; justify-content: center; 
  cursor: pointer; font-weight: bold; 
  color: var(--text-main); 
  box-shadow: 0 2px 6px var(--shadow-base); 
  transition: all 0.2s;
  line-height: 1;
}
.flex-grid {
  height: auto !important; 
  flex: 1;
  min-height: 0;
}
.back-btn:active { transform: scale(0.9); background: var(--bg-surface); }
.icon { font-size: 16px; transform: translateY(-1px); }

.title { 
  font-size: 16px; font-weight: bold; 
  color: var(--text-main); 
}
</style>