<template>
  <div class="settings-sidebar">
    <div class="header">系统设置</div>
    
    <div class="menu-list">
      <div 
        id="setting-item-startup"
        class="menu-item target-box"
        :class="{ active: route.name === 'settings-startup' }"
        @click="navTo('settings-startup', 'setting-item-startup')"
      >
        <span class="icon">🚀</span>
        <span class="label">启动行为</span>
        <span class="arrow">›</span>
      </div>

      <div 
        id="setting-item-appearance"
        class="menu-item target-box"
        :class="{ active: route.name === 'settings-appearance' }"
        @click="navTo('settings-appearance', 'setting-item-appearance')"
      >
        <span class="icon">🎨</span>
        <span class="label">外观显示</span>
        <span class="arrow">›</span>
      </div>

      <div 
        id="setting-item-play"
        class="menu-item target-box"
        :class="{ active: route.name === 'settings-play' }"
        @click="navTo('settings-play', 'setting-item-play')"
      >
        <span class="icon">📺</span>
        <span class="label">播放设置</span>
        <span class="arrow">›</span>
      </div>

      <div 
        id="setting-item-videocount"
        class="menu-item target-box"
        :class="{ active: route.name === 'settings-videocount' }"
        @click="navTo('settings-videocount', 'setting-item-videocount')"
      >
        <span class="icon">🔢</span>
        <span class="label">列表设置</span>
        <span class="arrow">›</span>
      </div>

      <div class="menu-item target-box disabled">
        <span class="icon">🔊</span>
        <span class="label">声音设置</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onActivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 页面 -> 默认焦点 ID 映射
const PAGE_FOCUS_MAP = {
  'settings-startup': 'startup-opt-welcome',
  'settings-appearance': 'mode-card-light',
  'settings-play': 'opt-quality-80',
  'settings-videocount': 'opt-count-20'
}

const navTo = (name, id) => {
  // 1. 路由跳转
  router.push({ name })

  // 2. 触发光标移动到详情页
  // 使用 setTimeout 给一点时间让组件挂载
  const targetId = PAGE_FOCUS_MAP[name]
  if (targetId) {
    setTimeout(() => {
      appStore.cursorMoveRequest = { 
        targetId: targetId, 
        timestamp: Date.now() 
      }
    }, 150) // 150ms 应该足够组件渲染
  }
}

// 抽取逻辑
const doAutoCursor = () => {
  // 只有当是从其他一级导航切过来时(比如刚点进设置)，才自动吸附
  // 简单判断：如果当前路由是 settings-startup (默认子路由) 且光标请求为空，或者为了保险起见，只要在这里就请求吸附
  // 这里我们强制触发，体验最强
  
  // 只有当没有待处理的请求时，才发送请求，防止覆盖
  // 或者我们可以强制聚焦第一个 "setting-item-startup"
  appStore.cursorMoveRequest = { 
    targetId: 'setting-item-startup', 
    timestamp: Date.now() 
  }
}

// 🎯 核心交互：组件挂载时，自动让光标飞过来
onMounted(() => {
  doAutoCursor()
})

// ⚡ 修复：当组件被 KeepAlive 缓存时，再次进入也触发
onActivated(() => {
  doAutoCursor()
})
</script>

<style scoped>
.settings-sidebar {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: var(--text-main); /* 适配深色 */
  padding-left: 8px;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  /* 使用变量 */
  background: var(--bg-glass);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  color: var(--text-sub); /* 适配深色 */
}

.menu-item:hover, .menu-item.active {
  background: var(--bg-surface); /* 适配深色 */
  transform: scale(1.02);
  box-shadow: 0 4px 12px var(--shadow-base); /* 使用变量 */
  color: var(--primary-color); /* 跟随主题色 */
}

.menu-item.active {
  border-left: 4px solid var(--primary-color); /* 跟随主题色 */
}

.icon { margin-right: 12px; font-size: 18px; }
.label { flex: 1; font-size: 15px; }
.arrow { color: var(--text-muted); font-weight: bold; }

.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}
</style>