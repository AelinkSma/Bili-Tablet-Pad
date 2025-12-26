<template>
  <div class="extra-panel-wrapper">
    <div class="panel-tabs">
      <div 
        class="tab-item target-box" 
        :class="{ active: appStore.extraPanelTab === 'comments' }"
        @click="switchTab('comments')"
      >
        评论
      </div>
      <div 
        class="tab-item target-box" 
        :class="{ active: appStore.extraPanelTab === 'details' }"
        @click="switchTab('details')"
      >
        详情
      </div>
      
      <div 
        v-if="appStore.isImmersive"
        class="close-btn target-box"
        @click="appStore.closeExtraPanel()"
      >
        ✕
      </div>
    </div>

    <div class="panel-content">
      <KeepAlive>
        <component :is="currentComponent" />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import VideoComments from './E_评论区.vue'
import VideoDetail from './D_视频详情.vue'

const appStore = useAppStore()

const currentComponent = computed(() => {
  return appStore.extraPanelTab === 'comments' ? VideoComments : VideoDetail
})

const switchTab = (tab) => {
  appStore.openExtraPanel(tab)
}
</script>

<style scoped>
.extra-panel-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--bg-glass); /* 复用全局玻璃背景 */
  /* backdrop-filter: blur(20px); */
}

.panel-tabs {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  gap: 16px;
}

.tab-item {
  font-size: 15px;
  font-weight: 600;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
  padding: 4px 8px;
  border-radius: 6px;
}

.tab-item.active {
  color: #fb7299;
  background: rgba(251, 114, 153, 0.1);
}

.close-btn {
  margin-left: auto;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: rgba(0,0,0,0.05);
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.panel-content {
  flex: 1;
  overflow: hidden; /* 内容滚动交给子组件 */
  position: relative;
}
</style>