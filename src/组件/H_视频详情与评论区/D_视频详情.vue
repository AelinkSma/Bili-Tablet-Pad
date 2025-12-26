<template>
  <div class="detail-container scroll-part">
    <div class="info-card">
      <h2 class="title">{{ video.title }}</h2>
      <div class="stats">
        <span>播放: {{ formatNum(video.stat?.view || video.view) }}</span>
        <span>弹幕: {{ formatNum(video.stat?.danmaku || video.danmaku) }}</span>
        <span>{{ formatDate(video.pubdate) }}</span>
      </div>
      <div class="desc target-box">{{ video.desc || '暂无简介' }}</div>
    </div>

    <div class="tags-row">
      <span v-for="tag in (video.tag?.split(',') || [])" :key="tag" class="tag">{{ tag }}</span>
    </div>
    
    <div class="relate-section">
      <h3>相关推荐</h3>
      <div class="placeholder-tip">推荐算法接入中...</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const video = computed(() => appStore.currentVideo || {})

const formatNum = (num) => num > 10000 ? (num / 10000).toFixed(1) + '万' : num
const formatDate = (ts) => ts ? new Date(ts * 1000).toLocaleDateString() : ''
</script>

<style scoped>
.detail-container { padding: 16px; height: 100%; overflow-y: auto; }

.title { 
  font-size: 18px; 
  font-weight: bold; 
  /* ❌ color: #333 */
  color: var(--text-main);
  margin: 0 0 8px 0; 
  line-height: 1.4; 
}

.stats { 
  font-size: 12px; 
  /* ❌ color: #999 */
  color: var(--text-muted);
  display: flex; 
  gap: 12px; 
  margin-bottom: 12px; 
}

.desc { 
  font-size: 13px; 
  /* ❌ color: #666 */
  color: var(--text-sub);
  line-height: 1.6; 
  white-space: pre-wrap; 
  margin-bottom: 20px; 
  padding: 10px; 
  /* ❌ background: rgba(0,0,0,0.03); */
  /* ✅ 使用边框变量作为微弱背景，深色模式下会自动变为半透明白 */
  background: var(--border-base); 
  border-radius: 8px; 
}

.tags-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }

.tag { 
  font-size: 11px; 
  /* ❌ background: rgba(0,0,0,0.05); color: #666; */
  /* ✅ 适配深色 */
  background: var(--border-base); 
  color: var(--text-sub);
  padding: 4px 10px; 
  border-radius: 12px; 
}

.relate-section h3 { 
  font-size: 15px; 
  margin-bottom: 10px; 
  /* ✅ 补充标题颜色 */
  color: var(--text-main);
}

.placeholder-tip { 
  font-size: 12px; 
  /* ❌ color: #ccc */
  color: var(--text-muted);
  text-align: center; 
  padding: 20px; 
  border: 1px dashed var(--border-base); 
  border-radius: 8px; 
}
</style>