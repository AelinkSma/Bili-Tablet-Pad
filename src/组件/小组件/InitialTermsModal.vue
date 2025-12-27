<template>
  <div v-if="!settingsStore.hasAcceptedTerms" class="terms-overlay">
    <div class="terms-card target-box">
      <h3>📜 使用协议与免责声明</h3>
      <div class="terms-content">
        <p><strong>1. 仅供研学：</strong> 本项目为 Vue 3 技术交流作品，请在下载安装后 24 小时内删除。严禁用于任何商业用途（包括但不限于倒卖、广告植入）。</p>
        <p><strong>2. 非官方身份：</strong> 本项目与哔哩哔哩（Bilibili）及其运营主体无任何关联。应用内所有内容版权归 Bilibili 及原作者所有。</p>
        <p><strong>3. 设备限制：</strong> 严禁在电视端（TV/OTT）安装本软件。本项目未适配电视端鉴权机制，强制使用可能导致无法播放，相关风险请自行承担。</p>
        <p><strong>4. 账号风险：</strong> 本项目使用非官方 API，继续使用即代表您愿意自行承担账号被风控、限制或封禁的风险。</p>
        <p><strong>5. 隐私承诺：</strong> 我们绝不收集或上传您的任何个人数据，Cookie 仅保存在您的本地设备。</p>
      </div>
      <button class="accept-btn target-box" @click="handleAccept">我已阅读并知晓风险，同意进入</button>
    </div>
  </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings'
const settingsStore = useSettingsStore()

const handleAccept = () => {
  settingsStore.acceptTerms()
}
</script>

<style scoped>
.terms-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(10px);
}
.terms-card {
  width: 80%; max-width: 500px; padding: 30px;
  background: var(--bg-surface); border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  border: 1px solid var(--border-base);
}
h3 {
  margin-top: 0;
  color: var(--text-main);
  text-align: center;
  margin-bottom: 20px;
}
.terms-content {
  max-height: 300px; overflow-y: auto; margin: 20px 0;
  font-size: 14px; line-height: 1.6; color: var(--text-sub);
  background: rgba(0,0,0,0.03);
  padding: 15px;
  border-radius: 10px;
}
.terms-content p {
  margin-bottom: 12px;
  text-align: justify;
}
.accept-btn {
  width: 100%; padding: 14px; border-radius: 12px;
  background: var(--primary-color); color: white;
  font-weight: bold; cursor: pointer; border: none;
  transition: opacity 0.2s;
}
.accept-btn:hover {
  opacity: 0.9;
}
</style>