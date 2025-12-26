<template>
  <div class="appearance-container">
    <div class="detail-header">
      <h2>外观显示</h2>
      <p class="subtitle">Customize visual experience</p>
    </div>

    <div class="section-block">
      <h3 class="section-title">界面模式</h3>
      <div class="mode-grid">
        <div 
          v-for="mode in modes"
          :key="mode.key"
          :id="`mode-card-${mode.key}`"
          class="mode-card target-box"
          :class="{ active: settingsStore.themeMode === mode.key }"
          @click="setMode(mode.key)"
        >
          <div class="mode-icon">{{ mode.icon }}</div>
          <div class="mode-info">
            <div class="mode-label">{{ mode.label }}</div>
            <div class="mode-desc">{{ mode.desc }}</div>
          </div>
          <div class="check-mark" v-if="settingsStore.themeMode === mode.key">✔</div>
        </div>
      </div>
    </div>


    <div class="section-block">
      <h3 class="section-title">主题强调色</h3>
      <div class="color-grid">
        <div 
          v-for="color in colors"
          :key="color.value"
          class="color-item target-box"
          :class="{ active: settingsStore.primaryColor === color.value }"
          :style="{ '--item-color': color.value }"
          @click="setColor(color.value)"
        >
          <div class="color-circle"></div>
          <span class="color-name">{{ color.label }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings'
import { THEME_MODES, ACCENT_COLORS } from './theme.config.js'

const settingsStore = useSettingsStore()
const modes = THEME_MODES
const colors = ACCENT_COLORS

const setMode = (mode) => {
  settingsStore.setThemeMode(mode)
}

const setColor = (color) => {
  settingsStore.setPrimaryColor(color)
}
</script>

<style scoped>
.appearance-container {
  height: 100%;
  padding: 40px;
  box-sizing: border-box;
  overflow-y: auto;
  /* 移除硬编码的浅色渐变，让底层背景透出来，或者使用透明 */
  background: transparent; 
}

.detail-header { margin-bottom: 32px; }
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

.section-block { margin-bottom: 40px; }
.section-title { 
  font-size: 16px; 
  color: var(--text-sub); /* 适配深色 */
  margin-bottom: 16px; 
  font-weight: 600; 
}

/* === 模式卡片 === */
.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 600px;
}

.mode-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 20px;
  /* 使用玻璃拟态变量 */
  background: var(--bg-glass);
  border: 1px solid var(--border-base);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-card:hover { 
  background: var(--bg-glass-heavy); 
  transform: translateY(-2px); 
}
.mode-card:active { transform: scale(0.98); }

.mode-card.active {
  background: var(--bg-surface);
  border: 2px solid var(--primary-color); 
  box-shadow: 0 8px 20px rgba(0,0,0,0.08); /* 阴影可以使用变量优化，这里暂保留微弱阴影 */
}

.mode-icon { font-size: 32px; margin-right: 16px; }
.mode-label { 
  font-size: 16px; 
  font-weight: bold; 
  color: var(--text-main); /* 适配深色 */
  margin-bottom: 4px; 
}
.mode-desc { 
  font-size: 12px; 
  color: var(--text-muted); /* 适配深色 */
}
.check-mark {
  position: absolute; top: 10px; right: 10px;
  color: var(--primary-color); font-weight: bold;
}

/* === 颜色网格 === */
.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border-radius: 12px;
  transition: transform 0.2s;
  background: var(--bg-glass); /* 适配深色 */
}

.color-item:hover { 
  transform: scale(1.1); 
  background: var(--bg-glass-heavy); 
}
.color-item:active { transform: scale(0.95); }

.color-circle {
  width: 48px; height: 48px;
  border-radius: 50%;
  background-color: var(--item-color);
  box-shadow: 0 4px 10px var(--shadow-base);
  margin-bottom: 8px;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.color-item.active .color-circle {
  border-color: var(--bg-surface); /* 适配深色：使用背景色作为间隔圈 */
  box-shadow: 0 0 0 2px var(--item-color), 0 8px 20px var(--shadow-base);
  transform: scale(1.1);
}

.color-name { 
  font-size: 12px; 
  color: var(--text-sub); /* 适配深色 */
  font-weight: 500; 
}
</style>