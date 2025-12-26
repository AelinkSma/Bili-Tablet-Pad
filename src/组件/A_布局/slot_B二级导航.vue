<template>
  <div class="side-manager">
    <Transition name="slide-fade" mode="out-in">
      
      <EpisodeList 
        v-if="appStore.showEpisodePanel && appStore.currentVideo" 
        key="episode-panel" 
      />

      <router-view v-else name="secondary-sidebar" v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </router-view>

    </Transition>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app'
import EpisodeList from '@/组件/H_视频详情与评论区/B_视频选集侧栏.vue'


const appStore = useAppStore()
</script>

<style scoped>
.side-manager {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* 简单的滑入动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>