<template>
  <div class="settings-detail-container">
    <div class="detail-header">
      <h2>视频列表长度</h2>
      <p class="subtitle">Video List Capacity</p>
    </div>

    <div class="options-grid">
      <div 
        v-for="opt in options"
        :key="opt.value"
        :id="`opt-count-${opt.value}`"
        class="option-card target-box"
        :class="{ selected: settingsStore.videoLoadCount === opt.value }"
        @click="selectCount(opt.value)"
      >
        <div class="count-num">{{ opt.label }}</div>
        <div class="check-mark" v-if="settingsStore.videoLoadCount === opt.value">✔</div>
      </div>
    </div>
    
    <div class="tip-text">
      <p>⚠️ 注意：设置数值越大，加载热门/分区列表时的等待时间越长。</p>
      <p>无限制模式将尝试加载最多 1000 条数据。</p>
      <p>当一块CPU的性能足够强大时,便可以挑战无限制的拷打,如果得到了无限制的认可,便会获得一枚...</p>
      <p>やめろ、おまえいったいなにしろ...</p>
    </div>
  </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

// 定义选项，'无限制' 我们暂定为 1000，防止请求死循环
const options = [
  { label: '20 条', value: 20 },
  { label: '40 条', value: 40 },
  { label: '60 条', value: 60 },
  { label: '80 条', value: 80 },
  { label: '100 条', value: 100 },
  { label: '无限制', value: 1000 } 
]

const selectCount = (val) => {
  settingsStore.setVideoLoadCount(val)
}
</script>

<style scoped>
.settings-detail-container {
  height: 100%;
  padding: 40px;
  box-sizing: border-box;
  overflow-y: auto;
  background: transparent;
}

.detail-header { margin-bottom: 32px; }
.detail-header h2 { 
  font-size: 32px; margin: 0 0 8px 0; color: var(--text-main); letter-spacing: -0.5px; 
}
.subtitle { 
  color: var(--text-muted); font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; 
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 600px;
  margin-bottom: 32px;
}

.option-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  background: var(--bg-glass);
  border: 1px solid var(--border-base);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-card:hover { 
  background: var(--bg-glass-heavy); 
  transform: translateY(-2px); 
}
.option-card:active { transform: scale(0.96); }

.option-card.selected {
  background: var(--bg-surface);
  border: 2px solid var(--primary-color);
  box-shadow: 0 4px 12px var(--shadow-base);
}

.count-num {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}
.option-card.selected .count-num {
  color: var(--primary-color);
}

.check-mark {
  position: absolute;
  top: 8px; right: 8px;
  font-size: 12px;
  color: var(--primary-color);
}

.tip-text {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
}
</style>