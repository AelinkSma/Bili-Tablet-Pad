<template>
  <div class="layout-container" :class="{ 'immersive-mode': appStore.isImmersive }">
    
    <aside class="panel sidebar frozen-target">
      <div class="fixed-inner">
        <slot name="sidebar">Side</slot>
      </div>
    </aside>

    <section class="panel secondary-sidebar frozen-target">
      <div class="fixed-inner">
        <slot name="secondary-sidebar">Sec</slot>
      </div>
    </section>

    <main class="panel main-content">
      <slot name="default">Main</slot>
    </main>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app'
const appStore = useAppStore()
</script>

<style scoped>
/* 样式已优化 */
.layout-container {
  /* 基础变量 */
  --border-radius: 2rem;
  
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: transparent; 
  color: var(--text-main);
  overflow: hidden;
  
  /* 🔒 关键点 1：永远保持固定的间距，全屏时也不要动！ */
  padding: 1.5rem;
  gap: 1.5rem;
  
  /* 移除 transition: padding/gap，因为我们不再改变它们 */
}
* { box-sizing: border-box; }

/* ❌ 删除这段代码！不要让背景塌陷！❌ */
/* .layout-container.is-fullscreen {
  padding: 0;
  gap: 0;
} */

.panel {
  /* 使用全局语义化变量，适配深色模式 */
  background-color: var(--bg-surface);
  border-radius: var(--border-radius);
  height: 100%;
  overflow: hidden;
  transition: background-color 0.3s, border-radius var(--anim-duration) var(--ease-out-quint);
  /* 可选：添加一点微弱的边框或阴影来增强层次感 */
  box-shadow: 0 4px 20px var(--shadow-base);
}

.sidebar, .secondary-sidebar {
  flex-shrink: 0;
  z-index: 20;
  /* 移除 width/flex 的 will-change，因为我们不改尺寸了 */
  will-change: opacity, transform; 
  transition: opacity 0.4s ease;
}

.sidebar { width: 5rem; }
.secondary-sidebar { width: 16rem; }

.main-content {
  flex-grow: 1;
  z-index: 10;
  position: relative;
  min-width: 0; 
  overflow: hidden;
}

.layout-container.is-fullscreen .main-content {
  border-radius: 0;
}

/* 🚀 沉浸模式策略：原地隐身 */
.immersive-mode .sidebar,
.immersive-mode .secondary-sidebar {
  /* 仅仅是透明度变为0，位置和占位完全保留 */
  opacity: 0;
  pointer-events: none;
  /* 延迟消失，配合视频放大的动画时间 */
  transition-delay: 0.1s;
}

.fixed-inner {
  width: 100%;
  height: 100%;
  overflow: hidden; 
}
</style>