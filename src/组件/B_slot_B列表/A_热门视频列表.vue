<template>
  <UniversalVideoGrid
    :list="appStore.videoList"
    :loading="false"
    id-prefix="video-card"
    :low-perf-mode="settingsStore.lowPerformanceMode"
    @click-video="handleVideoClick"
    @load-more="handleLoadMore"
  >
    <template #header>
      <h3 class="header-title">🔥 {{ appStore.currentTab === 'mine' ? '我的收藏' : '热门推荐' }}</h3>
    </template>
  </UniversalVideoGrid>
</template>

<script setup>
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import UniversalVideoGrid from '@/组件/小组件/UniversalVideoGrid.vue'

const appStore = useAppStore()
const settingsStore = useSettingsStore()

const handleVideoClick = (item) => {
  appStore.playVideo(item)
}

// ✨ 处理加载更多
const handleLoadMore = () => {
  // 仅在主页 Tab 下有效
  if (appStore.currentTab === 'home') {
    appStore.loadHomeData(true) // true = append mode
  }
}
</script>

<style scoped>
.header-title {
  margin: 0;
  color: #333;
  font-size: 15px;
  font-weight: 700;
}
</style>