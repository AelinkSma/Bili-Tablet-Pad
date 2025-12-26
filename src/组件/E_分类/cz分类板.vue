<template>
  <div class="category-board-wrapper">
    <div class="board-header">
      <h3>探索分区</h3>
      <span class="subtitle">Discover</span>
    </div>

    <div class="grid-container">
      <div 
        v-for="cat in categories" 
        :key="cat.rid"
        :id="`cat-btn-${cat.rid}`" 
        class="cat-card target-box"
        @click="openCategory(cat)"
      >
        <div class="cat-icon">{{ cat.icon }}</div>
        <div class="cat-label">{{ cat.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app' // 引入 store
import { useAutoCursor } from '@/hooks/useAutoCursor' // 引入 Hook

const router = useRouter()
const appStore = useAppStore()

// B站主要分区 ID 映射
const categories = [
  { rid: 1, label: '动画', icon: '🎬' },
  { rid: 13, label: '番剧', icon: '📺' },
  { rid: 167, label: '国创', icon: '🏮' },
  { rid: 3, label: '音乐', icon: '🎵' },
  { rid: 129, label: '舞蹈', icon: '💃' },
  { rid: 4, label: '游戏', icon: '🎮' },
  { rid: 36, label: '科技', icon: '🔬' },
  { rid: 188, label: '数码', icon: '📱' },
  { rid: 160, label: '生活', icon: '🧬' },
  { rid: 119, label: '鬼畜', icon: '🤡' },
  { rid: 155, label: '时尚', icon: '👗' },
  { rid: 5, label: '娱乐', icon: '🎉' },
  { rid: 181, label: '影视', icon: '🎞️' },
  { rid: 211, label: '美食', icon: '🍔' }
]

const openCategory = (cat) => {
  // 1. 记录当前焦点 ID，以便返回时找回
  appStore.pushFocus(`cat-btn-${cat.rid}`)
  
  // 2. 跳转
  router.push({ 
    name: 'category-list', 
    params: { rid: cat.rid },
    query: { title: cat.label } 
  })
}

// 🚀 自动聚焦第一个分类 (rid: 1 是动画)
useAutoCursor('cat-btn-1')
</script>

<style scoped>
.category-board-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
  scrollbar-width: none;
}

.board-header { margin-bottom: 20px; padding-left: 4px; }
.board-header h3 { margin: 0; font-size: 18px; color: var(--text-main); }
.subtitle { font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding-bottom: 20px;
}

.cat-card {
  background: var(--bg-glass); /* 适配深色 */
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  aspect-ratio: 1.2; /* 方形稍微扁一点 */
  border: 1px solid var(--border-base); /* 适配深色 */
}

.cat-card:active { transform: scale(0.95); background: var(--bg-surface); }

.cat-icon { font-size: 28px; margin-bottom: 8px; filter: drop-shadow(0 4px 4px var(--shadow-base)); }
.cat-label { font-size: 14px; font-weight: 600; color: var(--text-sub); }
</style>