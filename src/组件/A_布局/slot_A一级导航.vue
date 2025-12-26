<template>
  <div class="sidebar-container">
    <div class="logo-wrapper target-box" @click="handleLogoClick">
      <img src="../../image/Gemini_22Search.png" alt="Logo" class="app-logo" />
    </div>

    <nav class="nav-list">
      <div 
        v-for="item in menuItems" 
        :key="item.key"
        :id="`nav-${item.key}`" 
        class="nav-item target-box" 
        :class="{ active: appStore.currentTab === item.key }"
        @click="handleNavClick(item.key, `nav-${item.key}`)"
      >
        <div class="icon-box">
          <!-- <img src="/settings.svg" class="nav-icon" /> -->
           <span style="font-size: 20px;">{{ getIcon(item.key) }}</span>
        </div>
        <span class="label">{{ item.label }}</span>
        <div class="active-indicator" v-show="appStore.currentTab === item.key"></div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app'
import { useRouter } from 'vue-router'

const appStore = useAppStore()
const router = useRouter()

const menuItems = [
  { key: 'mine', label: '我的' },
  { key: 'home', label: '主页' },
  { key: 'category', label: '分类' },
  { key: 'settings', label: '设置' },
  { key: 'about', label: '关于' }
]

const getIcon = (key) => {
  const map = { mine: '👤', home: '🏠', category: '📦', settings: '⚙️', about: 'ℹ️' }
  return map[key]
}

const handleLogoClick = () => {
  appStore.switchTab('search') 
}

const handleNavClick = (key, id) => {
  // 注意：一级导航切换通常是"平级"的，我们不需要 pushStack
  // 除非你想实现：从"分类"按返回回到"主页"
  // 但根据你的描述，一级导航是根。
  // 所以这里我们只负责 switchTab，不需要 pushFocus，
  // 或者是清空 Focus (在 store.switchTab 里已经做了)
  appStore.switchTab(key)
}
</script>

<style scoped>
/* 样式保持原样，无需修改 */
.sidebar-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
.logo-wrapper {
  height: 80px; 
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer; 
}
.app-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: transform 0.2s;
}
.logo-wrapper:active .app-logo { transform: scale(0.9); }
.nav-list {
  flex: 1; 
  display: flex;
  flex-direction: column;
  padding-bottom: 12px; 
}
.nav-item {
  flex: 1; 
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
  color: #9499a0; 
  border-radius: 12px; 
  margin: 0 4px; 
}
.nav-item:hover { background-color: rgba(0,0,0,0.03); }
.nav-item:active { background-color: rgba(0,0,0,0.06); }
.icon-box {
  margin-bottom: 6px;
  opacity: 0.6;
  transition: all 0.3s ease;
}
.label {
  font-size: 11px;
  font-weight: 500;
  transition: color 0.3s;
}
.nav-item.active {
  color: #fb7299; 
}
.nav-item.active .icon-box {
  opacity: 1;
  transform: scale(1.1); 
}
.nav-item.active .label {
  font-weight: bold;
}
.active-indicator {
  position: absolute;
  left: -4px; 
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background-color: #fb7299;
  border-radius: 0 4px 4px 0;
  box-shadow: 2px 0 8px rgba(251, 114, 153, 0.3);
}
</style>