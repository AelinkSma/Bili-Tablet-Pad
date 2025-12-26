import { defineStore } from 'pinia'
import { getPopularVideos } from '@/api/modules/video'
import { useSettingsStore } from './settings'
import { getVideoComments } from '@/api/modules/video'

// ✅ 这里的引入现在是安全的，因为 router/index.js 不再在顶层引用 app.js
import router from '@/router' 

const BILI_API_PAGE_SIZE = 20; 

export const useAppStore = defineStore('app', {
  state: () => ({
    currentTab: 'home',
    videoList: [],
    homePage: 1, 
    currentVideo: null,
    focusStack: [],
    isFullscreen: false,
    showEpisodePanel: false, 
    cursorMoveRequest: null, 
    cache: {},
    lastPlayedBvid: null,
    isImmersive: false, 
    videoCommand: null, 
    slotBContent: 'episode',   
    extraPanelOpen: false, 
    extraPanelTab: 'comments', 
    dataPreloadCache: {}, 
  }),

  getters: {
    showSecondarySidebarOverlay: (state) => {
      if (!state.currentVideo) return false
      if (!state.extraPanelOpen) return false
      if (state.isImmersive) return false
      if (state.currentTab === 'settings' || state.currentTab === 'about') return false
      return true
    }
  },

  actions: {
    // ... 其他 action (toggleImmersive, sendVideoCommand 等) 保持不变 ...
    
    toggleImmersive() {
      if (this.isImmersive && this.extraPanelOpen) {
        this.closeExtraPanel()
      }
      this.isImmersive = !this.isImmersive
      this.isFullscreen = this.isImmersive
    },

    sendVideoCommand(type, payload) {
      this.videoCommand = { type, payload, timestamp: Date.now() }
    },

    openExtraPanel(tabType) {
      this.extraPanelTab = tabType
      this.extraPanelOpen = true
      this.showEpisodePanel = false
    },

    toggleExtraPanel(tabType) {
      if (this.extraPanelOpen && this.extraPanelTab === tabType) {
        this.closeExtraPanel()
      } else {
        this.openExtraPanel(tabType)
      }
    },

    closeExtraPanel() {
      this.extraPanelOpen = false
    },

    preloadExtraPanelData(tabType) {
      if (!this.currentVideo) return
      if (tabType === 'comments') {
        const aid = this.currentVideo.aid
        if (!aid) return 
        const cacheKey = `comments-${aid}-page1`
        if (!this.dataPreloadCache[cacheKey]) {
          const promise = getVideoComments(aid).catch(e => null)
          this.dataPreloadCache[cacheKey] = promise
          setTimeout(() => { delete this.dataPreloadCache[cacheKey] }, 10000)
        }
      }
    },
    
    consumePreload(key) {
      return this.dataPreloadCache[key]
    },

    playNextVideo() {
       // ... 保持不变
    },
    
    playPrevVideo() {
       // ... 保持不变
    },

    async loadHomeData(append = false) {
       // ... 保持不变 (代码较长略) ...
       // 请保留原来的 loadHomeData 完整逻辑
       const settingsStore = useSettingsStore()
       // ...
       try {
          const res = await getPopularVideos(this.homePage, BILI_API_PAGE_SIZE)
          // ... 你的加载逻辑
          if (res.code === 0 && res.data?.list) {
             const newItems = res.data.list
             if (append) {
                this.videoList = [...this.videoList, ...newItems]
             } else {
                this.videoList = newItems
             }
             this.homePage++
          }
       } catch(e) { console.error(e) }
    },

    async init() {
      const settingsStore = useSettingsStore()
      this.currentTab = 'home'
      this.focusStack = []
      this.showEpisodePanel = false
      this.isImmersive = false
      this.isFullscreen = false
      
      // ✅ 确保使用 replace 归位
      await router.replace({ name: 'home' })
      await this.loadHomeData()

      switch (settingsStore.startupBehavior) {
        case 'welcome': this.currentVideo = null; break;
        case 'home_first': 
          this.currentVideo = null; 
          if (this.videoList.length > 0) this.playVideo(this.videoList[0]); 
          break;
        case 'resume': if (this.currentVideo) console.log('恢复播放'); break;
      }
    },

    pushFocus(elementId) {
      this.focusStack.push({
        id: elementId,
        routeName: router.currentRoute.value.name
      })
    },

    goBack() {
      if (this.showEpisodePanel) {
        this.showEpisodePanel = false
        return
      }
      
      if (this.focusStack.length > 0) {
        const lastStep = this.focusStack.pop()
        if (lastStep && lastStep.id) {
          this.cursorMoveRequest = { targetId: lastStep.id, timestamp: Date.now() }
          
          if (lastStep.id.startsWith('nav-')) {
            const targetTab = lastStep.id.replace('nav-', '')
            this.currentTab = targetTab
            if (targetTab === 'home') this.loadHomeData()
            else if (targetTab === 'mine' || targetTab === 'category') this.videoList = [] 
          }
        }
        router.back()
        return
      }
      
      if (window.history.length > 1) router.back()
      else router.push('/')
    },

    playVideo(video) {
      this.currentVideo = video
      if (video?.bvid) this.lastPlayedBvid = video.bvid
      this.showEpisodePanel = false
      this.extraPanelOpen = false 
      this.dataPreloadCache = {} 
    },
    
    closeVideo() {
      this.currentVideo = null
      this.showEpisodePanel = false
    },

    // ✅✅✅ 【关键修复】switchTab 逻辑 ✅✅✅
    switchTab(key) {
      if (this.currentTab === key) return

      const previousNavId = `nav-${this.currentTab}`
      this.pushFocus(previousNavId)
      
      this.currentTab = key
      this.showEpisodePanel = false
      
      if (['settings', 'about'].includes(key)) {
        this.closeVideo()
      } 
      
      // 路由跳转
      if (['home', 'mine', 'category'].includes(key)) {
        router.push({ name: key })
      } else if (key === 'settings') {
        // 🔴 修复：这里不能用 name: 'settings'，因为父路由没有 name
        // 🟢 改为用 path 跳转
        router.push({ path: '/settings' })
      } else if (key === 'about') {
        router.push({ path: '/about' })
      } else if (key === 'search') {
        router.push({ name: 'search' })
      } else {
        router.push({ name: 'home' }) 
      }

      if (key === 'mine' || key === 'category') {
        this.videoList = []
      }
      if (key === 'home') {
        this.loadHomeData()
      }
    }
    
    // ...
  },
  
  persist: {
    paths: ['currentTab', 'cache', 'currentVideo'] 
  }
})