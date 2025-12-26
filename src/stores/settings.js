// src/stores/settings.js
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // 启动行为: 'welcome' | 'home_first' | 'resume'
    startupBehavior: 'welcome',
    
    // ⚡ 性能与数据设置
    videoLoadCount: 60, 
    lowPerformanceMode: true,

    // 🎨 新增：外观设置
    themeMode: 'light', // 'light' | 'dark'
    primaryColor: '#fb7299', // 默认粉色

    // 📺 新增：播放设置
    preferredQuality: 80, // 默认 1080P
  }),
  actions: {
    setStartupBehavior(mode) {
      this.startupBehavior = mode
    },
    setVideoLoadCount(count) {
      this.videoLoadCount = count
    },
    toggleLowPerfMode(status) {
      this.lowPerformanceMode = status
    },
    // 新增 actions
    setThemeMode(mode) {
      this.themeMode = mode
    },
    setPrimaryColor(color) {
      this.primaryColor = color
    },
    setPreferredQuality(quality) {
      this.preferredQuality = quality
    }
  },
  persist: true
})