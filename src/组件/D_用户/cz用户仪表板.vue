<template>
  <div class="user-manager">
    <transition name="slide-fade" mode="out-in">
      
      <div v-if="userStore.isLoggedIn" key="profile" class="profile-panel scroll-part">
        
        <div class="user-card target-box">
          <div class="header-row">
            <div class="face">
              <BiliImage 
              :src="userStore.userInfo.face"  
            />
            </div>
            <div class="info-col">
              <div class="name-row">
                <span class="username">{{ userStore.userInfo.uname }}</span>
                <span v-if="userStore.userInfo.vip?.status === 1" class="vip-tag">
                  {{ userStore.userInfo.vip.label.text || '大会员' }}
                </span>
              </div>
              
              <div class="level-box">
                <span class="lv-badge">LV.{{ userStore.userInfo.level_info.current_level }}</span>
                <div class="progress-bg">
                  <div class="progress-fill" :style="{ width: userStore.levelProgress + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="stat-row">
            <div class="stat-item">
              <span class="num">{{ formatNum(userStore.userInfo.stat?.following) }}</span>
              <span class="label">关注</span>
            </div>
            <div class="stat-item">
              <span class="num">{{ formatNum(userStore.userInfo.stat?.follower) }}</span>
              <span class="label">粉丝</span>
            </div>
            <div class="stat-item">
              <span class="num">{{ formatNum(userStore.userInfo.stat?.dynamic_count) }}</span>
              <span class="label">动态</span>
            </div>
          </div>
        </div>

        <div class="assets-grid">
          <div class="asset-item target-box">
            <span class="asset-icon">🪙</span>
            <span class="asset-num">{{ formatNum(userStore.userInfo.money) }}</span>
            <span class="asset-name">硬币</span>
          </div>
          <div class="asset-item target-box">
            <span class="asset-icon">⚡</span>
            <span class="asset-num">{{ userStore.userInfo.wallet?.bcoin_balance || 0 }}</span>
            <span class="asset-name">B币</span>
          </div>
        </div>

        <div class="menu-list">
          <div class="menu-item target-box">我的收藏</div>
          <div class="menu-item target-box">历史记录</div>
          <div class="menu-item target-box">稍后再看</div>
          <div class="menu-item logout target-box" @click="handleLogout">退出登录</div>
        </div>

      </div>

      <LoginPanel v-else key="login" @login-success="onLoginSuccess" />
    </transition>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import LoginPanel from './cz登录仪表板.vue'
import { getMyInfo, getMyStat } from '@/api/modules/auth'

import BiliImage from '@/组件/小组件/BiliImage.vue'

const userStore = useUserStore()

const formatNum = (num) => {
  if (!num) return '0'
  return num > 10000 ? (num / 10000).toFixed(1) + '万' : num
}

const handleLogout = () => {
  userStore.logout()
  location.reload() 
}

const onLoginSuccess = async () => {
  try {
    // 并行获取 基本信息 和 统计信息
    const [infoRes, statRes] = await Promise.all([
      getMyInfo(),
      getMyStat()
    ])

    if (infoRes.code === 0) {
      userStore.setUserInfo(infoRes.data)
    }
    
    // 即使 stat 失败也不影响主流程
    if (statRes.code === 0) {
      // 将 stat 数据合并进 userInfo
      userStore.setUserInfo({ stat: statRes.data })
    }
  } catch (e) {
    console.error('获取用户信息失败', e)
  }
}
</script>

<style scoped>
.user-manager { width: 100%; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; }
.scroll-part { flex: 1; overflow-y: auto; padding: 16px; scrollbar-width: none; }

/* 卡片风格 */
.user-card {
  background: rgba(255,255,255,0.8);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  /* backdrop-filter: blur(10px); */
}

.header-row { display: flex; align-items: center; margin-bottom: 20px; }
.face { width: 64px; height: 64px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-right: 16px; }

.info-col { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.name-row { 
  display: flex; 
  flex-direction: column; /* 关键：改为纵向 */
  align-items: flex-start; /* 左对齐 */
  margin-bottom: 8px; /* 增加与下方等级条的间距 */
}

.username { 
  font-weight: bold; 
  font-size: 18px; 
  color: #333; 
  margin-right: 0; /* 移除之前的右间距 */
  margin-bottom: 4px; /* 增加名字与 VIP 标签的间距 */
  line-height: 1.2;
}

.vip-tag { 
  font-size: 10px; 
  background: #fb7299; 
  color: #fff; 
  padding: 1px 6px; /*稍微减小一点 padding 让它更精致 */
  border-radius: 4px; 
  display: inline-block;
  line-height: 1.4;
}

.level-box { display: flex; align-items: center; font-size: 10px; }
.lv-badge { font-weight: 800; color: #fb7299; margin-right: 6px; font-style: italic; }
.progress-bg { flex: 1; height: 4px; background: rgba(0,0,0,0.1); border-radius: 2px; overflow: hidden; max-width: 100px; }
.progress-fill { height: 100%; background: #fb7299; border-radius: 2px; }

.stat-row { display: flex; justify-content: space-around; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 16px; }
.stat-item { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
.stat-item .num { font-weight: bold; font-size: 16px; color: #333; }
.stat-item .label { font-size: 12px; color: #999; margin-top: 2px; }

/* 资产网格 */
.assets-grid { display: flex; gap: 12px; margin-bottom: 20px; }
.asset-item {
  flex: 1; background: rgba(255,255,255,0.6); border-radius: 12px;
  padding: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: all 0.2s; cursor: pointer;
}
.asset-item:active { transform: scale(0.95); background: #fff; }
.asset-icon { font-size: 20px; margin-bottom: 4px; }
.asset-num { font-weight: bold; font-size: 14px; color: #333; }
.asset-name { font-size: 10px; color: #999; }

/* 菜单列表 */
.menu-item {
  padding: 14px 20px;
  background: rgba(255,255,255,0.6);
  border-radius: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background 0.2s;
  font-weight: 500;
}
.menu-item:hover { background: rgba(255,255,255,0.9); }
.menu-item.logout { color: #ff5050; margin-top: 20px; text-align: center; background: rgba(255,80,80,0.1); }

/* 动画 */
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translateX(10px); }
</style>