<template>
  <div class="compact-item target-box">
    <div class="thumb">
       <!-- 假设 BiliImage 组件已全局注册或自动引入 -->
       <BiliImage :src="video.pic" width="96px" height="60px" class="cover" />
       <span class="time">{{ formatTime(video.duration) }}</span>
    </div>
    <div class="info">
       <div class="title" v-html="video.title"></div>
       <div class="meta">{{ video.author }}</div>
    </div>
  </div>
</template>

<script setup>
import BiliImage from '@/组件/小组件/BiliImage.vue'

defineProps({
  video: {
    type: Object,
    required: true
  }
})

const formatTime = (str) => {
  // B站搜索API返回的 duration 可能是 "3:20" 字符串，也可能是秒数
  // 如果是字符串直接返回
  if (typeof str === 'string' && str.includes(':')) return str
  // 如果是秒数转格式 (简单处理)
  const s = parseInt(str)
  if (isNaN(s)) return '00:00'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.compact-item { 
  display: flex; 
  gap: 10px; 
  padding: 8px; 
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.compact-item:hover {
  background-color: rgba(0,0,0,0.05);
}
.thumb {
  position: relative;
  flex-shrink: 0;
  width: 96px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
}
.time {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 10px;
  color: white;
  background: rgba(0,0,0,0.6);
  padding: 1px 4px;
  border-radius: 2px;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}
.title {
  font-size: 13px;
  line-height: 1.4;
  color: #18191c;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* 处理搜索高亮标签 */
  :deep(em.keyword) {
    font-style: normal;
    color: #fb7299;
  }
}
.meta {
  font-size: 11px;
  color: #9499a0;
}
</style>
