<script setup>
import { onMounted, nextTick, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAppStore } from '@/stores/app'
import CZ from '@/组件/cz触控板.vue'
import Splitter from '@/组件/A_布局/总布局.vue'
import VideoPlayer from '@/组件/视频播放器.vue'
import VideoInfoContainer from '@/组件/H_视频详情与评论区/C_视频信息容器.vue'
import CommentSection from '@/组件/H_视频详情与评论区/E_评论区.vue'
import VideoDetail from '@/组件/H_视频详情与评论区/D_视频详情.vue'

const appStore = useAppStore()

onMounted(() => {
  appStore.init()
})

// === 核心 FLIP 动画逻辑 ===

// 获取 Slot C 的位置信息
const getSlotCMetrics = () => {
  // 这里写死你在 CSS 里的布局参数，比 getBoundingClientRect 更快更稳
  // 你的布局: left=25.5rem, top=1.5rem, right=1.5rem, bottom=1.5rem
  // 需要换算成 px。假设 root font-size 是 16px (默认)
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
  
  const top = 1.5 * rem
  const left = 25.5 * rem
  const width = window.innerWidth - (27 * rem)
  const height = window.innerHeight - (3 * rem)
  
  return { top, left, width, height }
}

const onEnter = (el, done) => {
  // 1. 进场时，如果不是全屏模式，需要从"小"变"大"吗？
  // 不，通常进场就是从小窗开始。
  // 我们直接定位到小窗位置。
  
  if (!appStore.isImmersive) {
    // 初始化在小窗位置
    const m = getSlotCMetrics()
    el.style.transform = `translate(${m.left}px, ${m.top}px)`
    el.style.width = `${m.width}px`
    el.style.height = `${m.height}px`
    el.style.borderRadius = '2rem'
    done()
  } else {
    // 如果直接全屏进场
    el.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    el.style.opacity = '0'
    el.style.transform = 'scale(0.9)'
    
    // 强制重绘
    el.offsetHeight
    
    el.style.opacity = '1'
    el.style.transform = 'scale(1)'
    
    setTimeout(() => {
      el.style.transition = ''
      done()
    }, 400)
  }
}

const onLeave = (el, done) => {
  // 离场动画
  el.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
  el.style.opacity = '0'
  el.style.transform = 'scale(0.95)'
  
  setTimeout(() => {
    el.style.transition = ''
    done()
  }, 300)
}

// 监听全屏状态变化，驱动动画
watch(() => appStore.isImmersive, (isFull) => {
  const el = document.querySelector('.video-overlay-fixed')
  if (!el) return

  const m = getSlotCMetrics()

  if (isFull) {
    // >>> 变为全屏 (Expand)
    
    // 1. 获取起始状态 (小窗) 的位置/尺寸
    // 注意：此时 el 应该是真实的 width/height (无 scale)
    const startRect = el.getBoundingClientRect()
    
    // 2. 强制设为全屏样式 (FLIP - Last)
    el.style.top = '0'
    el.style.left = '0'
    el.style.width = '100vw'
    el.style.height = '100vh'
    el.style.borderRadius = '0' 
    
    // 3. 计算逆变换 (Invert)
    // 目标是 100vw/100vh，起始是 startRect
    const scaleX = startRect.width / window.innerWidth
    const scaleY = startRect.height / window.innerHeight
    const translateX = startRect.left
    const translateY = startRect.top
    
    // 4. 应用初始 Transform (看起来还在小窗位置)
    el.style.transformOrigin = 'top left'
    el.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`
    el.style.transition = 'none' // 禁止 transition 以便立即应用
    
    // 强制重绘
    el.offsetHeight 
    
    // 5. 播放动画 (Play) -> 去除 Transform
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
      el.style.transform = 'translate(0, 0) scale(1, 1)'
    })
    
    // 动画结束后的清理 (可选)
    setTimeout(() => {
      el.style.transition = ''
    }, 500)

  } else {
    // >>> 变为小窗 (Shrink)
    
    // 1. 当前是全屏状态 (width=100vw, height=100vh, transform=none)
    
    // 2. 计算目标 Transform
    const scaleX = m.width / window.innerWidth
    const scaleY = m.height / window.innerHeight
    
    // 3. 开始动画
    el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
    el.style.transformOrigin = 'top left'
    el.style.transform = `translate(${m.left}px, ${m.top}px) scale(${scaleX}, ${scaleY})`
    el.style.borderRadius = '2rem' // 动画过程中开始变圆
    
    // 4. ✨✨✨ 关键修复：动画结束后，移除 Scale，恢复真实尺寸 ✨✨✨
    // 这样内容就不会被挤压变形了
    setTimeout(() => {
       // 移除 Transition 防止突变
       el.style.transition = 'none'
       
       // 移除 Scale Transform
       el.style.transform = `translate(${m.left}px, ${m.top}px)`
       // 注意：既然移除了 Scale，就需要把真实的 width/height 设回去
       // 但是 wait, 如果只 translate 不 scale，那 100vw 的内容会溢出吗？
       // 会的。所以必须同时修改 width/height。
       
       el.style.width = `${m.width}px`
       el.style.height = `${m.height}px`
       
       // 强制重绘确保生效
       el.offsetHeight
       
       // 恢复可能的 transition (如果需要后续 hover 效果等)
       el.style.transition = ''
    }, 500)
  }
})
</script>

<template>
  <CZ />
  
  <div class="background-layer" :inert="appStore.isImmersive">
    <Splitter>
      <template #sidebar>
        <router-view name="sidebar" />
      </template>
      <template #secondary-sidebar>
        <!-- 优先显示：全局评论/详情面板 (Store驱动) -->
        <transition name="fade-slide">
          <div 
            v-if="appStore.showSecondarySidebarOverlay" 
            class="sidebar-overlay-panel scroll-container"
          >
            <CommentSection 
              v-if="appStore.extraPanelTab === 'comments'" 
              :key="'comments-' + appStore.currentVideo?.aid" 
            />
            <VideoDetail 
              v-else-if="appStore.extraPanelTab === 'details'" 
              :key="'details-' + appStore.currentVideo?.bvid"
            />
          </div>
        </transition>

        <!-- 默认显示：当前路由对应的列表 -->
        <div v-show="!appStore.showSecondarySidebarOverlay" style="height: 100%; width: 100%">
          <router-view name="secondary-sidebar" v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </div>
      </template>
      <template #default>
        <div class="main-view-container" id="slot-c-anchor">
          <router-view />
        </div>
      </template>
    </Splitter>
  </div>

  <transition 
    :css="false"
    @enter="onEnter"
    @leave="onLeave"
  >
    <div 
      v-if="appStore.currentVideo" 
      class="video-overlay-fixed"
      :class="{ 'is-minimized': !appStore.isImmersive }"
    >
      <VideoPlayer :video="appStore.currentVideo" />
      
      <transition name="drawer-slide">
        <div 
          v-if="appStore.isImmersive && appStore.extraPanelOpen" 
          class="fullscreen-drawer target-box"
        >
          <VideoInfoContainer />
        </div>
      </transition>

    </div>
  </transition>
</template>

<style scoped>
/* 🚀 核心样式：始终 Fixed，由 GPU 负责缩放 */
.video-overlay-fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  background: #000;
  overflow: hidden;
  
  /* ⚡ 开启硬件加速 */
  will-change: transform;
  
  /* 🚫 禁止 CSS 动画 width/height/borderRadius */
  /* transition: none !important; */
}

/* 初始状态 (小窗) 由 JS 计算并通过内联样式覆盖 */

/* ✨ 新增抽屉样式 */
.fullscreen-drawer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 350px;
  background: rgba(30, 30, 30, 0.85); /* 深色磨砂 */
  /* backdrop-filter: blur(20px); */
  /* -webkit-backdrop-filter: blur(20px); */
  z-index: 200; /* 高于 VideoPlayer (默认0) 但低于 QualityCapsule(50) 和 Controls(需调整) */
  /* 注意：VideoPlayer 内部控件 z-index 很高，可能需要将 drawer 设得更高，
     或者让播放器感知到左侧有遮挡。
     这里设 200 应该能覆盖大部分内容。
  */
  border-right: 1px solid rgba(255,255,255,0.1);
  /* box-shadow: 10px 0 30px rgba(0,0,0,0.5); */
}

/* 抽屉动画 */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(-100%);
}

.sidebar-overlay-panel {
  width: 100%;
  height: 100%;
  background: var(--bg-surface); 
  color: var(--text-main);
  overflow-y: auto;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.main-view-container {
  width: 100%;
  height: 100%;
}
</style>