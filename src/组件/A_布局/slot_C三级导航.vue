<template>
  <div class="main-placeholder">
    <div class="content">
      <div class="icon">📺</div>
      <h2 class="title">欢迎来到 Bilibili Pad</h2>
      <p class="subtitle">请点击左侧视频卡片开始播放</p>
      <div class="tips">
        <span class="tag">热门推荐</span>
        <span class="tag">高清画质</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// 这是一个纯展示组件，无需逻辑
</script>

<style scoped>
.main-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 适配整体的磨砂玻璃风格 */
  background: var(--bg-glass);
  color: var(--text-main);
  text-align: center;
  user-select: none;
}

.icon {
  font-size: 80px;
  margin-bottom: 24px;
  /* 添加一个可爱的浮动动画 */
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 10px 10px var(--shadow-base));
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: var(--text-main); /* 适配深色 */
}

.subtitle {
  font-size: 16px;
  color: var(--text-sub); /* 适配深色 */
  margin-bottom: 24px;
}

.tips {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.tag {
  background: var(--primary-color-alpha); /* 使用主题色的透明背景 */
  color: var(--primary-color); /* 使用主题色 */
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
  100% { transform: translateY(0px); }
}
</style>