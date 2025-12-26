<template>
  <div class="settings-detail-container">
    <div class="detail-header">
      <h2>启动行为</h2>
      <p class="subtitle">Customize how Bilibili Pad starts up</p>
    </div>

    <div class="options-group">
      
      <div 
        id="startup-opt-welcome"
        class="option-card target-box"
        :class="{ selected: settingsStore.startupBehavior === 'welcome' }"
        @click="selectMode('welcome')"
      >
        <div class="radio-indicator">
          <div class="dot" v-show="settingsStore.startupBehavior === 'welcome'"></div>
        </div>
        <div class="text-content">
          <div class="opt-title">显示欢迎页</div>
          <div class="opt-desc">启动时保持安静，等待我选择内容</div>
        </div>
        <div class="illustration">👋</div>
      </div>

      <div 
        class="option-card target-box"
        :class="{ selected: settingsStore.startupBehavior === 'home_first' }"
        @click="selectMode('home_first')"
      >
        <div class="radio-indicator">
          <div class="dot" v-show="settingsStore.startupBehavior === 'home_first'"></div>
        </div>
        <div class="text-content">
          <div class="opt-title">自动播放推荐</div>
          <div class="opt-desc">像电视一样，打开即播放热门视频</div>
        </div>
        <div class="illustration">📺</div>
      </div>

      <div 
        class="option-card target-box"
        :class="{ selected: settingsStore.startupBehavior === 'resume' }"
        @click="selectMode('resume')"
      >
        <div class="radio-indicator">
          <div class="dot" v-show="settingsStore.startupBehavior === 'resume'"></div>
        </div>
        <div class="text-content">
          <div class="opt-title">继续播放上次内容</div>
          <div class="opt-desc">记忆断点，从上次离开的地方继续</div>
        </div>
        <div class="illustration">⏱️</div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const selectMode = (mode) => {
  settingsStore.setStartupBehavior(mode)
}
</script>

<style scoped>
.settings-detail-container {
  height: 100%;
  padding: 40px;
  box-sizing: border-box;
  overflow-y: auto;
  /* 移除硬编码渐变，让底层背景透出 */
  background: transparent;
}

.detail-header { margin-bottom: 40px; }
.detail-header h2 { 
  font-size: 32px; 
  margin: 0 0 8px 0; 
  color: var(--text-main); /* 适配深色 */
  letter-spacing: -0.5px; 
}
.subtitle { 
  color: var(--text-muted); /* 适配深色 */
  font-size: 14px; 
  font-weight: 500; 
  text-transform: uppercase; 
  letter-spacing: 1px; 
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
}

/* 2025 Aesthetic: 卡片式单选 */
.option-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 24px;
  background: var(--bg-glass); /* 适配深色 */
  border: 1px solid var(--border-base); /* 适配深色 */
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.option-card:hover {
  background: var(--bg-glass-heavy); /* 适配深色 */
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.05); /* 阴影可以使用通用变量，这里暂且保留微弱阴影 */
}

.option-card:active { transform: scale(0.98); }

/* 选中态高亮 */
.option-card.selected {
  background: var(--bg-surface); /* 适配深色 */
  border-color: var(--primary-color); /* 跟随主题色 */
  box-shadow: 0 8px 24px var(--shadow-base); /* 适配深色 */
}

/* 自定义 Radio UI */
.radio-indicator {
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 2px solid var(--border-base);
  margin-right: 20px;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.3s;
}

.option-card.selected .radio-indicator {
  border-color: var(--primary-color);
}

.dot {
  width: 12px; height: 12px;
  background: var(--primary-color); /* 跟随主题色 */
  border-radius: 50%;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.text-content { flex: 1; }
.opt-title { font-size: 18px; font-weight: 600; color: var(--text-main); margin-bottom: 4px; }
.opt-desc { font-size: 13px; color: var(--text-sub); }

.illustration { font-size: 28px; opacity: 0.8; }

@keyframes popIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}
</style>