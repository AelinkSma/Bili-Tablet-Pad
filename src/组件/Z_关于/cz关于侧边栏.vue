<template>
  <div class="about-sidebar">
    <div class="header">关于</div>

    <div class="menu-list">
      <div 
        id="about-item-disclaimer"
        class="menu-item target-box"
        :class="{ active: route.name === 'about-disclaimer' }"
        @click="navTo('about-disclaimer', 'about-item-disclaimer')"
      >
        <span class="icon">⚖️</span>
        <span class="label">免责声明</span>
        <span class="arrow">›</span>
      </div>

      <div 
        id="about-item-tech"
        class="menu-item target-box"
        :class="{ active: route.name === 'about-tech' }"
        @click="navTo('about-tech', 'about-item-tech')"
      >
        <span class="icon">❤️</span>
        <span class="label">技术致谢</span>
        <span class="arrow">›</span>
      </div>

      <div 
        id="about-item-motivation"
        class="menu-item target-box"
        :class="{ active: route.name === 'about-motivation' }"
        @click="navTo('about-motivation', 'about-item-motivation')"
      >
        <span class="icon">✨</span>
        <span class="label">项目初衷</span>
        <span class="arrow">›</span>
      </div>

      <div 
        id="about-item-features"
        class="menu-item target-box"
        :class="{ active: route.name === 'about-features' }"
        @click="navTo('about-features', 'about-item-features')"
      >
        <span class="icon">🛠️</span>
        <span class="label">核心特性</span>
        <span class="arrow">›</span>
      </div>

      <div 
        id="about-item-future"
        class="menu-item target-box"
        :class="{ active: route.name === 'about-future' }"
        @click="navTo('about-future', 'about-item-future')"
      >
        <span class="icon">🌱</span>
        <span class="label">未来展望</span>
        <span class="arrow">›</span>
      </div>
    </div>

    <div class="footer-info">
      <div class="info-item">
        <span class="info-label">Version</span>
        <span class="info-value">3.0.0 Alpha</span>
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

// 页面 -> 默认焦点 ID 映射 (对应详情页中的 ID)
const PAGE_FOCUS_MAP = {
  'about-disclaimer': 'content-disclaimer',
  'about-tech': 'content-tech',
  'about-motivation': 'content-motivation',
  'about-features': 'content-features',
  'about-future': 'content-future'
}

const navTo = (name, id) => {
  // 1. 路由跳转
  router.push({ name })

  // 2. 触发光标移动到详情页
  const targetId = PAGE_FOCUS_MAP[name]
  if (targetId) {
    setTimeout(() => {
      appStore.cursorMoveRequest = { 
        targetId: targetId, 
        timestamp: Date.now() 
      }
    }, 150)
  }
}

const doAutoCursor = () => {
  // 刚进入关于页面时，默认聚焦第一个选项
  appStore.cursorMoveRequest = { 
    targetId: 'about-item-disclaimer', 
    timestamp: Date.now() 
  }
}

onMounted(() => {
  doAutoCursor()
})

onActivated(() => {
  doAutoCursor()
})
</script>

<style scoped>
.about-sidebar {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: var(--text-main);
  padding-left: 8px;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--bg-glass);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  color: var(--text-sub);
}

.menu-item:hover, .menu-item.active {
  background: var(--bg-surface);
  transform: scale(1.02);
  box-shadow: 0 4px 12px var(--shadow-base);
  color: var(--primary-color);
}

.menu-item.active {
  border-left: 4px solid var(--primary-color);
}

.icon { margin-right: 12px; font-size: 18px; }
.label { flex: 1; font-size: 15px; }
.arrow { color: var(--text-muted); font-weight: bold; }

.footer-info {
  padding: 20px 0;
  border-top: 1px solid var(--border-base);
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
}
</style>