// src/stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // --- State ---
  const cookie = ref('')
  
  // ✨ 新增：Wbi 签名专用密钥缓存
  const wbiKeys = ref({
    img_key: '',
    sub_key: '',
    updated_at: 0
  })

  // 扩展：包含详细资产结构的 userInfo (保持不变)
  const userInfo = ref({
    mid: 0,
    uname: '未登录',
    face: '',
    level_info: { current_level: 0, current_exp: 0, next_exp: 0 },
    money: 0,
    wallet: { bcoin_balance: 0, coupon_balance: 0 },
    vip: { status: 0, type: 0, due_date: 0, label: { text: '' } },
    stat: { following: 0, follower: 0, dynamic_count: 0 }
  })

  // --- Getters ---
  const isLoggedIn = computed(() => !!(cookie.value && cookie.value.includes('SESSDATA')))
  
  // ✨ 新增: VIP 状态判断
  const isVip = computed(() => !!(userInfo.value?.vip?.status === 1))

  const levelProgress = computed(() => {
    const { current_exp, next_exp, current_min } = userInfo.value.level_info || {}
    if (!next_exp || next_exp === '--') return 100
    const total = next_exp - current_min
    const current = current_exp - current_min
    return Math.min(100, Math.max(0, (current / total) * 100))
  })

  // --- Actions ---
  const login = (cookieStr) => {
    cookie.value = cookieStr
  }

  const logout = () => {
    cookie.value = ''
    // 清空密钥
    wbiKeys.value = { img_key: '', sub_key: '', updated_at: 0 }
    // 重置用户信息
    userInfo.value = {
      mid: 0, uname: '未登录', face: '',
      level_info: { current_level: 0, current_exp: 0, next_exp: 1 },
      money: 0, wallet: { bcoin_balance: 0 }, vip: {},
      stat: { following: 0, follower: 0, dynamic_count: 0 }
    }
  }

  // ✨ 核心升级：解析 Wbi Key 的工具函数
  const extractWbiKeys = (navData) => {
    if (!navData || !navData.wbi_img) return
    
    try {
      const { img_url, sub_url } = navData.wbi_img
      
      // 提取文件名作为 Key (例如: .../wbi/7cd08494...png -> 7cd08494...)
      const getKey = (url) => url.split('/').pop().split('.')[0]
      
      const imgKey = getKey(img_url)
      const subKey = getKey(sub_url)
      
      if (imgKey && subKey) {
        wbiKeys.value = {
          img_key: imgKey,
          sub_key: subKey,
          updated_at: Date.now()
        }
        console.log('🔑 Wbi 密钥已更新')
      }
    } catch (e) {
      console.warn('Wbi Key 解析失败:', e)
    }
  }

  // 支持部分更新 (自动合并新旧数据)
  const setUserInfo = (data) => {
    // 1. 常规更新
    userInfo.value = { ...userInfo.value, ...data }
    
    // 2. ✨ 如果数据中包含 wbi_img，自动提取密钥
    if (data.wbi_img) {
      extractWbiKeys(data)
    }
  }

  // ✨ 新增：检查密钥是否有效 (未过期且存在)
  const checkWbiValid = () => {
    const { img_key, sub_key, updated_at } = wbiKeys.value
    // 有效期设为 12 小时 (12 * 60 * 60 * 1000)
    const isValid = img_key && sub_key && (Date.now() - updated_at < 43200000)
    return isValid
  }

  const checkLoginStatus = () => {
    if (!isLoggedIn.value) {
      logout()
      return false
    }
    return true
  }

  return {
    isLoggedIn,
    isVip, // 导出 Getter
    cookie,
    userInfo,
    wbiKeys, // 导出 State
    levelProgress,
    login,
    logout,
    setUserInfo,
    checkLoginStatus,
    checkWbiValid // 导出检查方法
  }
}, {
  persist: {
    // ✨ 记得把 wbiKeys 也持久化，这样用户下次打开 App 不用立刻重新请求
    paths: ['cookie', 'userInfo', 'wbiKeys']
  }
})