<template>
  <div class="about-container scroll-part">
    
    <!-- 静态头部 -->
    <div class="header-section">
      <div class="logo-wrapper">
        <img src="@/image/Gemini_22Search.png" class="app-logo" />
        <div class="logo-glow"></div>
      </div>
      <h1 class="app-name">Bili Tablet <span class="tag">Pad</span></h1>
      <div class="version-badge">Version 3.0.0 Alpha</div>
      <!-- <p class="slogan">为平板而生 · 沉浸式 B 站客户端</p> -->
    </div>

    <!-- 静态操作栏 -->
    <div class="action-row">
      <div class="action-btn target-box" @click="openLink('https://github.com/yourname/bili-tablet')">
        <span class="icon">🐙</span>
        <span>GitHub 仓库</span>
      </div>
      <div class="action-btn target-box" @click="openLink('https://github.com/yourname/bili-tablet/issues')">
        <span class="icon">🐛</span>
        <span>反馈 Bug</span>
      </div>
      <div class="action-btn target-box" @click="checkUpdate">
        <span class="icon">🚀</span>
        <span>检查更新</span>
      </div>
      <div class="action-btn target-box" @click="openLink('https://space.bilibili.com/356769818')">
        <span class="icon">👤</span>
        <span>个人主页</span>
      </div>
    </div>

    <!-- 动态内容区 -->
    <div class="content-section">
      
      <!-- 1. 免责声明 -->
      <div 
        v-if="currentTab === 'about-disclaimer'" 
        id="content-disclaimer" 
        class="disclaimer-wrapper fade-in"
      >
        <div class="card target-box">
          <h3 class="card-title">⚠️ 免责声明</h3>
          <div class="card-text disclaimer-content">
            <p class="paragraph">
              <strong>非官方身份：</strong> 本应用（Bili Tablet）是由开源社区爱好者独立开发的第三方客户端，旨在探索Vue 3与跨平台技术的极致体验。本项目与<strong>哔哩哔哩 (Bilibili)</strong>及其运营主体无任何关联、隶属或授权关系。
            </p>
            <p class="paragraph">
              <strong>知识产权：</strong> 应用内展示的所有视频、弹幕、评论、封面及音频等数据，其知识产权均归 Bilibili 平台及相关内容创作者（UP主）所有。本项目仅作为数据的呈现载体，不拥有也不主张任何内容的版权。
            </p>
            <p class="paragraph">
              <strong>账号风险：</strong> 由于使用了非官方 API 接口，尽管我们已尽力模拟正常流量行为，但仍无法完全排除被平台风控系统判定为“异常登录”或“使用第三方软件”的风险。<strong>继续使用本应用即代表您愿意自行承担账号被限制、封禁等潜在风险。</strong>
            </p>
            <p class="paragraph">
              <strong>隐私安全：</strong> 我们恪守数据隐私底线。您的登录凭证（Cookie/Token）仅存储于您设备的本地存储中，并直接与 Bilibili 官方服务器进行加密通信。本项目<strong>绝不</strong>会上传、收集或通过任何中间服务器转发您的个人隐私数据。
            </p>
            <p class="paragraph">
              <strong>广告策略：</strong> 本项目致力于提供纯净的浏览体验，当前未植入任何形式的广告。需明确的是，这并非针对 Bilibili 官方商业内容的恶意屏蔽，而是受限于非官方接口的技术特性。我们深知商业变现对于平台长久运营的重要性，若 Bilibili 官方提出接入广告业务或调整相关功能以保障其商业利益的要求，本项目承诺将予以积极响应与配合。
            </p>
            <p class="paragraph last">
              <strong>商业禁令：</strong> 本项目遵循 <strong>GPL v3.0 开源协议</strong>，但严禁将本项目及其衍生品用于任何形式的商业盈利（包括但不限于付费下载、广告植入、会员倒卖）。如果您认可本应用的体验，请务必支持 Bilibili 官方正版客户端及大会员服务。
            </p>
          </div>
        </div>
      </div>

      <!-- 2. 技术致谢 -->
      <div 
        v-if="currentTab === 'about-tech'" 
        id="content-tech" 
        class="fade-in"
      >
        <div class="card target-box">
          <h3 class="card-title">❤️ 技术致谢</h3>
          <p class="card-text mb-2">感谢以下开源项目让开发变得可能：</p>
          <div class="tech-tags">
            <span class="tech-tag">Vue 3</span>
            <span class="tech-tag">Vite</span>
            <span class="tech-tag">Capacitor</span>
            <span class="tech-tag">Pinia</span>
            <span class="tech-tag">VueUse</span>
            <span class="tech-tag">Axios</span>
            <span class="tech-tag">ArtPlayer</span>
            <span class="tech-tag">Shaka Player</span>
            <span class="tech-tag">Protobuf.js</span>
            <span class="tech-tag">QRCode</span>
            <span class="tech-tag">Spark-MD5</span>
          </div>
        </div>

        <div class="card target-box" style="margin-top: 16px;">
          <h3 class="card-title">❤️ AI 协力</h3>
          <p class="card-text mb-2">特别感谢以下AI伙伴提供的智慧支持：</p>
          <ul class="feature-list">
            <li><b>Google Gemini</b>（最大功臣）</li>
            <li><b>Tencent CodeBuddy</b>（第二功臣）</li>
            <li><b>小米 小爱同学：</b>（第三功臣）</li>
          </ul>
        </div>
      </div>

      <!-- 3. 项目初衷 -->
      <div 
        v-if="currentTab === 'about-motivation'" 
        id="content-motivation" 
        class="fade-in"
      >
        <div class="card target-box">
          <h3 class="card-title">✨ 项目初衷</h3>
          <p class="card-text">
            项目开发的初衷是躺在床上想使用平板刷视频,但是发现操作非常困难,我无法使用一根手指完成所有操作,而哔哩哔哩官方的安卓手机端软件和平板端的软件在平板端的布局都不符合我的操作逻辑,再加上我不喜欢和抖音一样的竖屏操作(因为这样子我会感觉被操纵一样,下一个视频并不是我想看,而是被强制推荐的感觉),再加上对编程有一定的兴趣,所以我决定自己开发一款软件,来满足我的需求.当然，如果日后真的还有机会能在我的简历上增添一点小小的光彩，那自然是再好不过了啦.
          </p>
        </div>
      </div>

      <!-- 4. 核心特性 -->
      <div 
        v-if="currentTab === 'about-features'" 
        id="content-features" 
        class="fade-in"
      >
        <div class="card target-box">
          <h3 class="card-title">🛠️ 核心特性</h3>
          <ul class="feature-list">
            <li><b>原生沉浸：</b> 基于 Capacitor 的深度全屏优化，无缝手势控制。</li>
            <li><b>画质解锁：</b> 完整支持 DASH 协议，解锁 1080P+ / 4K / Dolby Vision（需会员）。</li>
            <li><b>高效内核：</b> ArtPlayer + Shaka Player 双引擎，秒开视频，极低占用。</li>
            <li><b>硬核弹幕：</b> 基于 Protobuf 协议解析海量弹幕，高性能渲染不掉帧。</li>
          </ul>
        </div>
      </div>

      <!-- 5. 未来展望 -->
      <div 
        v-if="currentTab === 'about-future'" 
        id="content-future" 
        class="fade-in"
      >
        <div class="card target-box">
          <h3 class="card-title">🌱 未来展望</h3>
          <div class="card-text">
            <p class="paragraph">
              代码的世界总是充满变数，就像人生。因即将迎接一场手术，项目的更新或许会按下暂停键。但我始终怀揣着一份美好的希冀，期待在身体痊愈后的某个午后，能再次打开这个工程，继续未竟的梦想：
            </p>
            <ul class="feature-list" style="margin: 16px 0;">
              <li><b>🎨 美术重构：</b> 亲手绘制更多精致的 PNG 与 SVG 素材，填补当前视觉资源的空白。</li>
              <li><b>👍 互动完善：</b> 实现点赞、收藏与评论区的完整交互，让连接不再单向。</li>
              <li><b>🖱️ 触控进化：</b> 修复触控板逻辑，增加按钮自定义功能，并编写一份详尽的使用指南。</li>
              <li><b>🔍 体验优化：</b> 进一步打磨搜索界面，引入更多个性化设置选项。</li>
            </ul>
            <p class="paragraph">
              开源的魅力在于薪火相传。如果屏幕前的你，愿意接过这根接力棒，替我完成这些构想，我将不胜感激。代码无言，却见证着我们对美好的共同向往。
            </p>
            <p class="paragraph last" style="text-align: right; margin-top: 20px; font-style: italic; opacity: 0.6;">
              Every decision you make, every action you take, is a choice about the world
            </p>
            <p class="paragraph last" style="text-align: right; font-style: italic; opacity: 0.8;">
              有缘再见，无缘再见。
            </p>
          </div>
        </div>
      </div>
      <div class="footer">
      Designed & Developed by <b>Your Name</b><br/>
      Copyright © 2025 Bili Tablet Team
    </div>
    </div>

    
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 根据路由名称判断显示哪个版块
const currentTab = computed(() => route.name)

const openLink = (url) => {
  window.open(url, '_blank')
}

const checkUpdate = () => {
  alert('当前已是最新版本 (v3.0.0 Alpha)')
}
</script>

<style scoped>
.about-container {
  height: 100%;
  padding: 40px;
  overflow-y: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-main);
  scrollbar-width: none;
}

/* --- 头部 --- */
.header-section {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.logo-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.app-logo {
  width: 96px;
  height: 96px;
  border-radius: 22px;
  position: relative;
  z-index: 2;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}

.logo-glow {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  background: var(--primary-color);
  filter: blur(20px);
  opacity: 0.4;
  z-index: 1;
  transform: translateY(10px);
}

.app-name {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 8px 0;
  letter-spacing: -1px;
}

.app-name .tag {
  color: var(--primary-color);
  font-size: 0.8em;
}

.version-badge {
  display: inline-block;
  background: rgba(0,0,0,0.05);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-sub);
  margin-bottom: 12px;
}

.slogan {
  font-size: 14px;
  color: var(--text-muted);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
}

/* --- 按钮组 --- */
.action-row {
  display: flex;
  gap: 16px;
  margin-bottom: 40px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-glass);
  border: 1px solid var(--border-base);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-sub);
}

.action-btn:hover {
  background: var(--bg-surface);
  transform: translateY(-2px);
  color: var(--primary-color);
  box-shadow: 0 4px 12px var(--shadow-base);
}

/* --- 内容卡片 --- */
.content-section {
  width: 100%;
  max-width: 600px;
  /* 确保占位，防止切换时跳动 */
  min-height: 200px; 
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}

.card {
  background: var(--bg-glass);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--border-base);
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: var(--text-main);
  display: flex;
  align-items: center;
}

.card-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-sub);
  margin: 0;
}

.disclaimer-content {
  /* max-height: 50vh; Removed to allow full page scrolling */
  /* overflow-y: auto; Removed to allow full page scrolling */
  padding-right: 0; 
}

.disclaimer-content .paragraph {
  margin-bottom: 12px;
  text-align: justify;
}

.disclaimer-content .paragraph.last {
  margin-bottom: 0;
}

.disclaimer-content strong {
  color: var(--text-main);
  font-weight: 600;
}

.feature-list {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  color: var(--text-sub);
  line-height: 1.8;
}

.mb-2 { margin-bottom: 12px; }

/* 技术标签 */
.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tag {
  font-size: 12px;
  background: rgba(0,0,0,0.05);
  padding: 4px 10px;
  border-radius: 6px;
  color: var(--text-muted);
}

/* --- 动画 --- */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.footer {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  opacity: 0.6;
  padding-bottom: 20px;
  margin-top: 20px;
  flex-shrink: 0; /* 防止被压缩 */
  position: relative; /*确保层级正确*/
  /* z-index: 1; */
  width: 100%; /* 占满宽度 */
  padding-top: 60px; 
  /* 增加顶部间距，防止内容紧贴 */
}
</style>