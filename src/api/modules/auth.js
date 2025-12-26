// src/api/modules/auth.js
import request from '@/api/request'

// 获取二维码 Key
export const getQrCode = () => {
  return request({
    url: 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate',
    method: 'GET'
  })
}

// 轮询二维码状态
export const pollQrCode = (qrcode_key) => {
  return request({
    url: 'https://passport.bilibili.com/x/passport-login/web/qrcode/poll',
    method: 'GET',
    params: { qrcode_key }
  })
}

// 获取个人信息
export const getMyInfo = () => {
  return request({
    url: '/x/web-interface/nav',
    method: 'GET'
  })
}

// ✨ 新增：获取个人统计信息 (关注、粉丝、动态)
export const getMyStat = () => {
  return request({
    url: '/x/web-interface/nav/stat',
    method: 'GET'
  })
}