import axios from 'axios'
import { Capacitor, CapacitorHttp } from '@capacitor/core'

// 判断环境
const isNative = Capacitor.isNativePlatform()

// 封装一个通用的请求函数
const request = async (options) => {
  // 1. 处理 URL (如果是原生，拼接完整 B 站地址；如果是网页，拼接 /api)
  const baseUrl = isNative ? 'https://api.bilibili.com' : '/api'
  const fullUrl = baseUrl + options.url

  console.log(`[HTTP调试] 环境:${isNative?'原生':'网页'} | 最终URL: ${fullUrl}`)
  if (isNative) {
    // ==============================
    // 🚀 方案 A: 安卓原生环境 (绕过浏览器限制)
    // ==============================
    const config = {
      url: fullUrl,
      method: options.method || 'GET',
      headers: {
        // 在这里设置 Referer 和 Cookie，原生环境绝对不会报错
        'Referer': 'https://www.bilibili.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'buvid3=87F63990-0720-3320-9B22-83020623193425267infoc;', 
        'Content-Type': 'application/json',
        ...options.headers // 合并传入的其他 header
      },
      params: options.params, // GET 参数
      data: options.data      // POST 数据
    }

    // 调用 Capacitor 原生 HTTP 插件
    const response = await CapacitorHttp.request(config)

    // 错误处理 (原生 HTTP 不会自动抛错，需要手动判断状态码)
    if (response.status >= 400) {
      throw new Error(`请求被拒绝: ${response.status}`)
    }

    // 格式化返回结果，使其结构与 Axios 保持一致，这样 HomeView 不用改代码
    return {
      data: response.data, // B站的返回数据
      status: response.status,
      headers: response.headers
    }

  } else {
    // ==============================
    // 🌍 方案 B: 电脑网页开发环境 (走 Vite 代理)
    // ==============================
    // 创建一个临时的 axios 实例
    const webInstance = axios.create({ timeout: 10000 })
    return webInstance({
      url: fullUrl,
      method: options.method || 'GET',
      params: options.params,
      data: options.data,
      ...options
    })
  }
}

// 导出模拟 Axios 的语法糖
export default {
  get: (url, config = {}) => request({ ...config, method: 'GET', url }),
  post: (url, data, config = {}) => request({ ...config, method: 'POST', url, data }),
  request
}