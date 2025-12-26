/**
 * @file Bilibili API 请求封装 / Request Wrapper for Bilibili API
 * @description 本项目仅供学习交流使用，严禁用于商业用途。
 * @disclaimer This project is for educational purposes only. Do not use for commercial purposes.
 * 
 * 核心功能：
 * 1. Native/Web 双端适配
 * 2. Wbi 签名自动化 / Automated Wbi Signing
 * 3. 身份凭证管理 / Credentials Management
 */

import axios from 'axios'
import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { useUserStore } from '@/stores/user' // 1. 引入 Store
import { encWbi } from '@/utils/wbi'         // 2. 引入加密工具 

const NATIVE_BASE_URL = 'https://api.bilibili.com'
const WEB_BASE_URL = '/api'
const PC_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

let cachedCookie = '';
let initPromise = null;

// ✨ 升级版：初始化访客身份 & Wbi 密钥
const initGuestIdentity = async (forceRefresh = false) => {
  const userStore = useUserStore() // 在函数内部获取 Store 实例，避免循环引用

  // 如果不是强制刷新，且 Cookie 和 Wbi 密钥都完好，直接返回
  if (!forceRefresh && cachedCookie && userStore.checkWbiValid()) {
    return cachedCookie;
  }

  // 防止并发请求重复初始化
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('🔍 [Auth] 正在初始化 B站 身份与密钥...');
      const response = await CapacitorHttp.request({
        url: 'https://api.bilibili.com/x/web-interface/nav',
        method: 'GET',
        headers: { 'User-Agent': PC_USER_AGENT }
      });

      // 1. 处理 Cookie
      const rawCookies = response.headers['Set-Cookie'] || response.headers['set-cookie'];
      if (rawCookies) {
        const cookieStr = Array.isArray(rawCookies) ? rawCookies.join(';') : rawCookies;
        cachedCookie = cookieStr;
        userStore.login(cookieStr) // 同步到 Store
        console.log('✅ [Auth] 身份 Cookie 获取成功');
      }

      // 2. ✨ 处理 Wbi 密钥 (即使是游客，B站也会下发 wbi_img)
      if (response.data && response.data.data) {
        // 调用 Store 的 Action 自动提取并缓存密钥
        userStore.setUserInfo(response.data.data) 
      }

    } catch (e) {
      console.error('❌ [Auth] 初始化失败:', e);
    } finally {
      initPromise = null;
    }
    return cachedCookie;
  })();

  return initPromise;
};

const request = async ({ url, method = 'GET', params = {}, data = {}, headers = {}, responseType = 'json' }) => {
  const isNative = Capacitor.isNativePlatform()
  const userStore = useUserStore() // 获取 Store

  try {
    // ============================================================
    // 🔐 核心拦截：Wbi 自动化签名
    // ============================================================
    if (params && params.useWbi) {
      // 1. 检查密钥是否有效
      if (!userStore.checkWbiValid()) {
        console.warn('⚠️ [Wbi] 密钥缺失或过期，强制刷新...')
        // 强制刷新身份信息 (fetch /nav)
        await initGuestIdentity(true)
      }

      // 2. 再次检查 (如果刷新失败则无法签名)
      if (userStore.checkWbiValid()) {
        const { img_key, sub_key } = userStore.wbiKeys
        // 3. ✨ 计算签名 (这一步会消耗掉 useWbi 标记，并生成 w_rid)
        const signedParams = encWbi(params, img_key, sub_key)
        
        // 4. 替换原始参数 (移除 useWbi，添加 w_rid 和 wts)
        delete signedParams.useWbi
        params = signedParams
        
        // console.log('🔐 [Wbi] 签名完成:', params)
      } else {
        console.error('❌ [Wbi] 签名失败：无法获取有效密钥')
        // 可以选择抛出错误，或者尝试发送未签名的请求(通常会403)
      }
    }
    // ============================================================

    if (isNative) {
      // 优先使用 Store 里的 Cookie，回退到缓存
      let finalCookie = userStore.cookie || cachedCookie

      // 针对 bilibili 域名的请求，确保有 Cookie
      if (url.includes('bilibili.com') || !url.startsWith('http')) {
         if (!finalCookie) {
           await initGuestIdentity(); 
           finalCookie = cachedCookie; 
         }
      }

      let fullUrl = url.startsWith('http') ? url : NATIVE_BASE_URL + url
      if (fullUrl.startsWith('http://')) fullUrl = fullUrl.replace('http://', 'https://')
      
      const config = {
        url: fullUrl,
        method: method.toUpperCase(),
        params,
        data,
        headers: {
          'User-Agent': PC_USER_AGENT,
          'Cookie': finalCookie, 
          'Referer': 'https://www.bilibili.com/', // Wbi 接口对 Referer 敏感，保持这个
          ...headers 
        },
        responseType: responseType === 'blob' ? 'blob' : (responseType === 'arraybuffer' ? 'arraybuffer' : 'json')
      }

      const response = await CapacitorHttp.request(config)

      if (response.status === 412) {
        cachedCookie = ''; 
        throw new Error('触发风控 (412)，请稍后重试或切换网络')
      }
      
      // Wbi 接口如果没有签名，通常返回 403
      if (response.status === 403) {
        console.warn('⚠️ 请求返回 403，可能是 Wbi 签名无效')
      }

      if (response.status >= 400) {
        throw new Error(`Native Request Error: ${response.status}`)
      }

      // 挂载 Headers (为了 login 轮询能拿到 Set-Cookie)
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        Object.defineProperty(response.data, 'headers', {
          value: response.headers,
          enumerable: false 
        });
      }

      return response.data
    } 
    
    // Web 代理模式 (开发环境)
    else {
      let finalUrl = url
      // ... (保留原本的代理替换逻辑) ...
      if (url.includes('comment.bilibili.com')) {
         finalUrl = url.replace(/https?:\/\/comment\.bilibili\.com/, '/dm')
      } else if (url.includes('hdslb.com')) {
        finalUrl = url.replace(/^https?:\/\/.*\.hdslb\.com\/bfs/, '/bfs')
      } else if (url.includes('passport.bilibili.com')) {
        finalUrl = finalUrl.replace('https://passport.bilibili.com', '/auth')
      } else if (!url.startsWith('http')) {
        finalUrl = WEB_BASE_URL + url
      }
      
      // 注意：Web 模式下 encWbi 同样有效，但你需要配置好 Vite 代理解决跨域
      // 且 Web 模式下 Cookie 由浏览器自动管理，我们手动加的 Cookie header 可能会被浏览器拒绝
      
      return axios({
        url: finalUrl,
        method,
        params,
        data,
        headers, 
        responseType
      }).then(res => res.data)
    }

  } catch (error) {
    console.error('[API Error]', error)
    throw error
  }
}

export default request