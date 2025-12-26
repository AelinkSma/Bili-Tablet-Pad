<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
import { ScreenOrientation } from '@capacitor/screen-orientation'
import { setupTheme } from '@/组件/G_设置/设置中心/B_外观显示/themeSetup'

// ✨ 引入刚刚创建的 CSS 文件
import '@/组件/G_设置/设置中心/B_外观显示/theme.css'

// 🎨 初始化主题系统
setupTheme()

const setImmersiveMode = async () => {
  if (Capacitor.getPlatform() !== 'android') return
  try {
    await ScreenOrientation.lock({ orientation: 'landscape' })
    await StatusBar.hide()
    await StatusBar.setOverlaysWebView({ overlay: true })
  } catch (e) {
    console.warn('全屏设置异常:', e)
  }
}

onMounted(async () => {
  await setImmersiveMode()
})
</script>

<template>
  <div id="app-root">
    <RouterView />
  </div>
</template>

<style>
/* 全局重置 */
body { margin: 0; padding: 0; overflow: hidden; background: var(--bg-base); transition: background 0.3s; }

/* 必须确保 #app-root 占满屏幕，否则背景色可能覆盖不全 */
#app-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-base); /* 使用变量 */
  color: var(--text-main);    /* 使用变量 */
  transition: background 0.3s, color 0.3s;
}

:root {
  --safe-area-top: env(safe-area-inset-top);
  --safe-area-bottom: env(safe-area-inset-bottom);
}
:root, body, html, iframe, div, a, button {
  -webkit-tap-highlight-color: transparent !important;
  -webkit-user-select: none; 
  user-select: none;
  outline: none !important;
  border: none !important;
}
iframe {
  display: block; 
  box-shadow: none !important;
  background-color: transparent !important;
}
</style>