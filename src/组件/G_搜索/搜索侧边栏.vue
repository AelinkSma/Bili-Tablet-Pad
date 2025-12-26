<template>
  <div class="search-panel">
    <div class="search-header">
      <div class="search-bar target-box" id="search-input-wrapper" @click="focusInput">
        <textarea
          id="search-input"
          ref="textareaRef"
          v-model="inputVal"
          @keydown.enter.prevent="handleSearch"
          @input="adjustHeight"
          placeholder="搜索视频..."
          rows="1"
          class="search-textarea"
          autocomplete="off"
        ></textarea>
        <div class="search-icon" @click.stop="handleSearch">🔍</div>
      </div>
    </div>

    <!-- 🔥 新增：关闭视频控制条 -->
    <div 
      v-if="appStore.currentVideo" 
      class="player-control target-box" 
      id="search-close-video-btn"
      @click="appStore.closeVideo()"
    >
       <div class="control-text">正在播放: {{ appStore.currentVideo.title }}</div>
       <div class="close-icon">❌ 停止播放</div>
    </div>

    <div class="content-area scroll-part" id="search-sidebar-content">
      <!-- 状态一：无视频播放（浏览模式） -> 始终显示历史和热搜，作为 Slot C 结果的补充 -->
      <div v-if="!appStore.currentVideo" class="suggestion-area">
        
        <!-- 历史记录 -->
        <div v-if="historyList.length" class="history-section">
          <div class="section-header">
            <div class="section-title">搜索历史</div>
            <div class="clear-btn" @click="clearHistory">清除</div>
          </div>
          <div class="history-tags">
             <div 
               v-for="(tag, idx) in historyList" 
               :key="idx" 
               class="tag target-box"
               @click="quickSearch(tag)"
             >
               {{ tag }}
             </div>
          </div>
        </div>

        <div class="hot-section">
          <div class="section-title">热门搜索</div>
          <div class="hot-tags">
            <div 
              v-for="(item, index) in searchStore.hotList" 
              :key="index"
              class="hot-tag target-box"
              @click="quickSearch(item.keyword)"
            >
              {{ index + 1 }}. {{ item.keyword }}
            </div>
          </div>
        </div>
      </div>

      <!-- 状态二：正在搜索且当前有视频播放 -> 显示紧凑列表 -->
      <!-- 只有当有视频播放时，结果才显示在这里。否则结果显示在 Slot C -->
      <div v-if="appStore.currentVideo && searchStore.resultList.length" class="compact-list">
         <CompactVideoItem 
            v-for="(item, index) in searchStore.resultList" 
            :key="item.bvid" 
            :id="`search-res-list-${index}`"
            :video="item"
            :class="{ 'active-card': appStore.currentVideo?.bvid === item.bvid }"
            @click="play(item)"
          />
      </div>
      
      <div v-if="searchStore.isLoading" class="loading">正在加载...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, watch, nextTick } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useAppStore } from '@/stores/app'
import CompactVideoItem from '@/组件/小组件/CompactVideoItem.vue'

const searchStore = useSearchStore()
const appStore = useAppStore()
const inputVal = ref('')
const historyList = ref([])
const textareaRef = ref(null)

// 🔥 监听视频播放，自动将光标定位到 Slot B 对应的列表项
watch(() => appStore.currentVideo, (newVal) => {
  if (newVal) {
    const idx = searchStore.resultList.findIndex(v => v.bvid === newVal.bvid)
    if (idx !== -1) {
      nextTick(() => {
        // 稍微延迟等待 DOM 渲染 (因为 compact-list 是 v-if 显示的)
        setTimeout(() => {
          appStore.cursorMoveRequest = { 
            targetId: `search-res-list-${idx}`, 
            timestamp: Date.now() 
          }
        }, 150)
      })
    }
  }
})

// 🔥 核心逻辑：进入页面时，光标主动吸附到搜索框，但 不自动弹出键盘
const requestCursorFocus = () => {
  setTimeout(() => {
    appStore.cursorMoveRequest = { 
      targetId: 'search-input-wrapper', 
      timestamp: Date.now() 
    }
  }, 200) // 稍作延迟，确保视图切换动画完成
}

onMounted(() => {
  searchStore.loadHotSearch()
  loadHistory()
  requestCursorFocus()
})

onActivated(() => {
  requestCursorFocus()
  // 恢复高度
  adjustHeight()
})

// 用户主动点击搜索框容器时，才聚焦 Input 唤起键盘
const focusInput = () => {
  textareaRef.value?.focus()
}

const adjustHeight = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto' // Reset to calculate scrollHeight correctly
  el.style.height = el.scrollHeight + 'px'
}

const loadHistory = () => {
  try {
    const json = localStorage.getItem('search_history')
    if (json) historyList.value = JSON.parse(json)
  } catch (e) { console.error(e) }
}

const saveHistory = (kw) => {
  if (!kw) return
  // 去重，移到最前
  const list = historyList.value.filter(x => x !== kw)
  list.unshift(kw)
  if (list.length > 10) list.pop()
  historyList.value = list
  localStorage.setItem('search_history', JSON.stringify(list))
}

const clearHistory = () => {
  historyList.value = []
  localStorage.removeItem('search_history')
}

const handleSearch = () => {
  const kw = inputVal.value.trim()
  if (!kw) return
  
  saveHistory(kw)
  
  // 让 Input 失焦，收起软键盘
  textareaRef.value?.blur()
  searchStore.doSearch(kw)
}

const quickSearch = (keyword) => {
  inputVal.value = keyword
  handleSearch()
}

const play = (video) => {
  // 🔥 同步播放列表，确保播放器的上下文正确
  appStore.videoList = [...searchStore.resultList]
  appStore.playVideo(video)
}
</script>

<style scoped>
.search-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-surface, #fff);
  border-right: 1px solid rgba(0,0,0,0.05);
}
.search-header {
  padding: 16px;
  flex-shrink: 0;
}
.search-bar {
  display: flex;
  align-items: center;
  background: #f1f2f3;
  border-radius: 8px;
  padding: 0 12px;
  min-height: 40px; /* 改为 min-height */
  height: auto;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.search-bar:focus-within {
  background: #fff;
  border-color: #fb7299;
  box-shadow: 0 0 0 2px rgba(251, 114, 153, 0.2);
}
.search-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: #18191c;
  resize: none;
  overflow: hidden;
  font-family: inherit;
  line-height: 20px;
  padding: 10px 0;
  height: auto;
  min-height: 20px;
}
.search-icon {
  margin-left: 8px; /* 增加间距 */
  cursor: pointer;
  opacity: 0.6;
  flex-shrink: 0; /* 防止被挤压 */
}
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.clear-btn {
  font-size: 12px;
  color: #9499a0;
  cursor: pointer;
}
.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #18191c;
}
.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.tag {
  font-size: 12px;
  padding: 4px 10px;
  background: #f6f7f8;
  border-radius: 4px;
  color: #61666d;
  cursor: pointer;
}
.hot-section {
  margin-top: 10px;
}
.hot-tag {
  padding: 8px 0;
  font-size: 13px;
  color: #61666d;
  cursor: pointer;
  border-bottom: 1px solid #f1f2f3;
}
.hot-tag:hover {
  color: #fb7299;
}
.loading {
  text-align: center;
  padding: 20px;
  color: #9499a0;
}
.active-card {
  background-color: rgba(251, 114, 153, 0.1) !important;
  border-left: 3px solid #fb7299;
}
.player-control {
  margin: 0 16px 12px 16px;
  padding: 10px 12px;
  background: #fff0f6; /* 浅粉色背景 */
  border: 1px solid #ffd6e7;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  color: #fb7299;
  transition: all 0.2s;
}
.player-control:hover {
  background: #ffe6ef;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(251, 114, 153, 0.2);
}
.control-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 10px;
  font-weight: 500;
}
.close-icon {
  flex-shrink: 0;
  font-weight: bold;
}
</style>