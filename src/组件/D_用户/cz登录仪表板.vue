<template>
  <div class="login-panel">
    <h3>扫码登录 Bilibili</h3>
    
    <div class="qr-container target-box">
      <div v-if="loading" class="loading">获取中...</div>
      <img v-else-if="qrUrl" :src="qrUrl" class="qr-img" />
      <div v-else class="error" @click="initQRCode">点击重试</div>
      
      <div v-if="isExpired" class="mask" @click="initQRCode">
        <span>已过期<br/>点击刷新</span>
      </div>
    </div>

    <p class="status-text">{{ statusMsg }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getQrCode, pollQrCode } from '@/api/modules/auth'
import { useUserStore } from '@/stores/user'
import QRCode from 'qrcode' // 需要安装: npm install qrcode

const emit = defineEmits(['login-success'])
const userStore = useUserStore()

const loading = ref(true)
const qrUrl = ref('')
const qrKey = ref('')
const statusMsg = ref('请使用 Bilibili 手机端扫码')
const isExpired = ref(false)

let timer = null

// 1. 初始化二维码
const initQRCode = async () => {
  loading.value = true
  isExpired.value = false
  statusMsg.value = '正在加载二维码...'
  clearInterval(timer)

  try {
    const res = await getQrCode()
    if (res.code === 0) {
      const url = res.data.url
      qrKey.value = res.data.qrcode_key
      
      // 将链接转为二维码图片 Base64
      qrUrl.value = await QRCode.toDataURL(url, { margin: 1, width: 180 })
      
      loading.value = false
      statusMsg.value = '请使用 Bilibili 手机端扫码'
      
      // 开始轮询
      startPoll()
    } else {
      statusMsg.value = '获取失败: ' + res.message
      loading.value = false
    }
  } catch (e) {
    console.error(e)
    statusMsg.value = '网络错误'
    loading.value = false
  }
}

// 2. 轮询逻辑
const startPoll = () => {
  timer = setInterval(async () => {
    try {
      const res = await pollQrCode(qrKey.value)
      
      // 🛑 核心修复：先判断接口通不通，再判断业务状态
      if (res.code === 0) {
        // 获取内部的业务状态码
        const loginData = res.data
        const status = loginData.code

        if (status === 0) {
          // 🎉 真正的登录成功
          clearInterval(timer)
          statusMsg.value = '登录成功！'
          
          // 获取 Cookie (需要配合 request.js 的修复)
          // 这里的 res.headers 是我们之前修改 request.js 时手动挂载上去的
          // 如果你还没修改 request.js，这里可能取不到 Set-Cookie，导致无法持久化登录
          const rawCookies = res.headers ? (res.headers['Set-Cookie'] || res.headers['set-cookie']) : ''
          let cookieStr = ''
          if (Array.isArray(rawCookies)) cookieStr = rawCookies.join(';')
          else cookieStr = rawCookies || ''
          
          userStore.login(cookieStr)
          emit('login-success')
          
        } else if (status === 86090) {
          // ✅ 已扫码，等待确认
          statusMsg.value = '✅ 已扫码，请在手机上确认'
        } else if (status === 86038) {
          // ⌛ 二维码过期
          clearInterval(timer)
          isExpired.value = true
          statusMsg.value = '二维码已过期'
        } else {
          // 86101: 未扫码 (继续轮询，不做操作)
          // console.log('等待扫码...')
        }
      } else {
        // 接口本身报错 (比如参数错误)
        statusMsg.value = '接口异常: ' + res.message
      }
    } catch (e) {
      console.warn('轮询异常', e)
    }
  }, 3000)
}

onMounted(() => {
  initQRCode()
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.login-panel {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; color: #333;
}
.qr-container {
  width: 180px; height: 180px; background: #fff; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin: 20px 0; position: relative; overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.qr-img { width: 100%; height: 100%; display: block; }
.mask {
  position: absolute; inset: 0; background: rgba(255,255,255,0.9);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #fb7299; font-weight: bold; text-align: center;
}
.status-text { font-size: 14px; color: #666; }
</style>