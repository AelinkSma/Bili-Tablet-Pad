<template>
  <div class="episode-panel">
    <div class="panel-header">
      <div class="title-row">
        <h3>当前播放</h3>
        <span class="tag">更新中</span>
      </div>
      <div class="video-title">{{ currentTitle }}</div>
    </div>

    <div class="scroll-area">
      <div class="section">
        <div class="section-title">选集 ({{ episodeList.length }})</div>
        <div class="episode-grid">
          <div 
            v-for="(ep, index) in episodeList" 
            :key="index"
            class="ep-item target-box"
            :class="{ active: currentEp === index }"
            @click="switchEp(index)"
          >
            <span v-if="currentEp === index" class="playing-icon">▶</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">猜你喜欢</div>
        <div class="relate-card target-box" v-for="i in 3" :key="i">
           <div class="relate-cover"></div>
           <div class="relate-info">
             <div class="relate-t">相关视频推荐 {{ i }}</div>
             <div class="relate-up">UP主名称</div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const currentEp = ref(0)

// 模拟数据，后续可从 Store 或 API 获取
const currentTitle = computed(() => appStore.currentVideo?.title || '正在加载视频信息...')

const episodeList = ref(new Array(12).fill(1)) // 模拟12集

const switchEp = (index) => {
  currentEp.value = index
  // 这里可以添加切集逻辑
}
</script>

<style scoped>
.episode-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255,255,255,0.5);
  /* backdrop-filter: blur(10px); */
}

.panel-header {
  padding: 16px;
  background: rgba(255,255,255,0.6);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  flex-shrink: 0;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.title-row h3 { margin: 0; font-size: 16px; color: #333; }
.tag { font-size: 10px; color: #fb7299; background: rgba(251,114,153,0.1); padding: 2px 6px; border-radius: 4px; }

.video-title {
  font-size: 13px; color: #666; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  scrollbar-width: none;
}

.section { margin-bottom: 24px; }
.section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333; }

.episode-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.ep-item {
  aspect-ratio: 1;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.ep-item:hover { transform: scale(1.05); box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
.ep-item.active { background: #fb7299; color: #fff; border-color: #fb7299; }

.relate-card {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px;
  background: #fff;
  border-radius: 8px;
}
.relate-cover { width: 80px; height: 50px; background: #eee; border-radius: 4px; }
.relate-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.relate-t { font-size: 12px; color: #333; }
.relate-up { font-size: 10px; color: #999; }
</style>