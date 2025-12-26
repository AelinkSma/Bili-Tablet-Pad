<template>
  <div class="play-settings-container">
    <div class="detail-header">
      <h2>播放设置</h2>
      <p class="subtitle">Default Quality Preference</p>
    </div>

    <!-- 游客限制遮罩 -->
    <div v-if="!userStore.isLoggedIn" class="guest-mask">
      <div class="mask-content">
        <div class="mask-icon">🔒</div>
        <h3>游客身份限制</h3>
        <p>登录后可解锁 1080P+ 及 4K 画质选项，并保存您的偏好设置。</p>
      </div>
    </div>

    <div class="section-block" :class="{ 'disabled-area': !userStore.isLoggedIn }">
      <h3 class="section-title">默认画质偏好 (Ceiling Strategy)</h3>
      <p class="section-desc">我们将尝试为您播放不高于此选项的最佳画质。如果视频不支持或权益不足，将自动降级。</p>
      
      <div class="quality-grid">
        <div 
          v-for="opt in qualityOptions"
          :key="opt.qn"
          :id="`opt-quality-${opt.qn}`"
          class="quality-card target-box"
          :class="{ 
            active: settingsStore.preferredQuality === opt.qn,
            'is-vip-only': opt.vipOnly && !userStore.isVip
          }"
          @click="setQuality(opt.qn)"
        >
          <div class="quality-val">{{ opt.label }}</div>
          <div class="quality-desc">{{ opt.desc }}</div>
          
          <!-- 选中标记 -->
          <div class="check-mark" v-if="settingsStore.preferredQuality === opt.qn">✔</div>

          <!-- VIP 提示 -->
          <div v-if="opt.vipOnly && !userStore.isVip" class="vip-warning">
            需大会员权益，实际播放可能降级
          </div>
          <div v-else-if="opt.vipOnly && userStore.isVip" class="vip-warning">
            您是尊贵的大会员,请尽情享受高画质
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUserStore } from '@/stores/user'

const settingsStore = useSettingsStore()
const userStore = useUserStore()

const qualityOptions = [
  { qn: 125, label: '真彩 HDR', desc: 'HDR 10 / Dolby Vision (需大会员)', vipOnly: true },
  { qn: 120, label: '超清 4K', desc: '2160P 超高分辨率 (需大会员)', vipOnly: true },
  { qn: 116, label: '高清 1080P60', desc: '高帧率流畅体验 (需大会员)', vipOnly: true },
  { qn: 80,  label: '高清 1080P', desc: '清晰细腻，大部分视频支持', vipOnly: false },
  { qn: 64,  label: '高清 720P', desc: '节省流量，适合小屏观看', vipOnly: false },
  { qn: 32,  label: '清晰 480P', desc: '画面一般，网络较差时推荐', vipOnly: false },
  { qn: 16,  label: '流畅 360P', desc: '最低画质，仅保证流畅播放', vipOnly: false },
]

const setQuality = (qn) => {
  if (!userStore.isLoggedIn) return // 游客不可点
  settingsStore.setPreferredQuality(qn)
}
</script>

<style scoped>
.play-settings-container {
  position: relative;
  height: 100%;
  padding: 40px;
  box-sizing: border-box;
  overflow-y: auto;
  background: transparent;
}

.detail-header { margin-bottom: 32px; }
.detail-header h2 { 
  font-size: 32px; 
  margin: 0 0 8px 0; 
  color: var(--text-main); 
  letter-spacing: -0.5px; 
}
.subtitle { 
  color: var(--text-muted); 
  font-size: 14px; 
  font-weight: 500; 
  text-transform: uppercase; 
  letter-spacing: 1px; 
}

.section-block { margin-bottom: 40px; position: relative; }
.section-title { 
  font-size: 16px; 
  color: var(--text-sub); 
  margin-bottom: 8px; 
  font-weight: 600; 
}
.section-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 24px;
  max-width: 600px;
  line-height: 1.5;
}

/* === 画质卡片 === */
.quality-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  max-width: 800px;
}

.quality-card {
  position: relative;
  padding: 20px;
  background: var(--bg-glass);
  border: 1px solid var(--border-base);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.quality-card:hover { 
  background: var(--bg-glass-heavy); 
  transform: translateY(-2px); 
}
.quality-card:active { transform: scale(0.98); }

.quality-card.active {
  background: var(--bg-surface);
  border: 2px solid var(--primary-color); 
  box-shadow: 0 8px 20px rgba(0,0,0,0.08); 
}

.quality-val { 
  font-size: 18px; 
  font-weight: bold; 
  color: var(--text-main); 
  margin-bottom: 6px; 
}
.quality-desc { 
  font-size: 12px; 
  color: var(--text-muted); 
}
.check-mark {
  position: absolute; top: 12px; right: 12px;
  color: var(--primary-color); font-weight: bold; font-size: 18px;
}

.vip-warning {
  margin-top: 10px;
  font-size: 11px;
  color: #fb7299; /* 警告色保持粉色或用黄色 */
  background: rgba(251, 114, 153, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  align-self: flex-start;
}

/* === 游客限制 === */
.disabled-area {
  opacity: 0.4;
  pointer-events: none;
  filter: grayscale(0.8);
}

.guest-mask {
  position: absolute;
  top: 100px; /* 避开标题 */
  left: 40px;
  right: 40px;
  bottom: 40px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mask-content {
  background: var(--bg-surface);
  border: 1px solid var(--border-base);
  padding: 30px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  max-width: 400px;
}

.mask-icon { font-size: 40px; margin-bottom: 16px; }
.mask-content h3 { margin: 0 0 10px 0; color: var(--text-main); }
.mask-content p { margin: 0; color: var(--text-muted); font-size: 14px; line-height: 1.5; }
</style>