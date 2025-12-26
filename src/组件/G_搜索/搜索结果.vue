<template>
  <div class="search-grid-wrapper">
    <!-- 只有当有结果或者正在加载时显示网格，并且没有视频正在播放 -->
    <!-- 🔥 修复：当视频播放时，销毁网格，防止光标吸附到后台元素 -->
    <UniversalVideoGrid
      v-if="(searchStore.resultList.length || searchStore.isLoading) && !appStore.currentVideo"
      :list="searchStore.resultList"
      :loading="searchStore.isLoading"
      id-prefix="search-res-grid"
      :low-perf-mode="settingsStore.lowPerformanceMode"
      :columns="4"
      @click-video="handleVideoClick"
      @load-more="handleLoadMore"
    >
      <template #header>
        <h3 class="search-title" v-if="searchStore.keyword">
          🔎 "{{ searchStore.keyword }}" 的搜索结果
        </h3>
      </template>
    </UniversalVideoGrid>
    
    <!-- 初始空状态 (同样在播放视频时隐藏) -->
    <div v-else-if="!appStore.currentVideo" class="initial-state">
      <div class="hint-icon">⌨️</div>
      <div class="hint-text">输入关键词开始搜索</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, nextTick } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import UniversalVideoGrid from '@/组件/小组件/UniversalVideoGrid.vue'

const searchStore = useSearchStore()
const appStore = useAppStore()
const settingsStore = useSettingsStore()

// 🔥 核心逻辑：当视频关闭，网格重新挂载时，恢复光标位置
onMounted(() => {
  if (appStore.lastPlayedBvid && !appStore.currentVideo) {
    const idx = searchStore.resultList.findIndex(v => v.bvid === appStore.lastPlayedBvid)
    if (idx !== -1) {
      nextTick(() => {
        setTimeout(() => {
          appStore.cursorMoveRequest = { 
            targetId: `search-res-grid-${idx}`, 
            timestamp: Date.now() 
          }
        }, 150)
      })
    }
  }
})

const handleVideoClick = (video) => {
  // 🔥 核心逻辑：同步播放列表
  // 模仿热门视频列表的行为，让播放器知道当前的上下文是搜索结果列表
  // 这样播放器内的"下一个"按钮就能正常工作
  appStore.videoList = [...searchStore.resultList] 
  
  appStore.playVideo(video)
}

const handleLoadMore = () => {
  searchStore.loadMore()
}
</script>

<style scoped>
.search-grid-wrapper {
  height: 100%;
  overflow-y: auto; /* UniversalVideoGrid 内部通常需要滚动容器，但它自己没有 overflow:auto，它依赖父级 */
  scrollbar-width: none;
}
.search-title {
  padding-left: 12px;
  font-size: 16px;
  font-weight: bold;
  color: #18191c;
  margin: 10px 0;
}
.initial-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9499a0;
  opacity: 0.6;
}
.hint-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.hint-text {
  font-size: 16px;
}
</style>