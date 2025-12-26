import SparkMD5 from 'spark-md5'

// --- 🔒 Part A: 静态混淆表 (B站硬编码的算法) ---
const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52
]

// 缓存变量：避免每次请求都重新计算 Mixin Key
let cachedRawKeys = '' // 记录上次输入的原始 Key (img_key + sub_key)
let cachedMixinKey = '' // 缓存计算好的 Mixin Key

/**
 * 核心算法 1：获取混淆后的 Mixin Key
 * @param {string} orig - 原始的 img_key + sub_key
 * @returns {string} 混淆后的 key
 */
function getMixinKey(orig) {
  // ⚡️ 性能优化：缓存命中检查
  if (cachedMixinKey && cachedRawKeys === orig) {
    return cachedMixinKey
  }

  // 这里的计算稍微“重”一点点，但有了缓存，几小时才跑一次
  let temp = ''
  for (let i = 0; i < MIXIN_KEY_ENC_TAB.length; i++) {
    const idx = MIXIN_KEY_ENC_TAB[i]
    if (idx < orig.length) {
      temp += orig[idx]
    }
  }
  
  // 更新缓存
  cachedRawKeys = orig
  cachedMixinKey = temp.slice(0, 32)
  return cachedMixinKey
}

/**
 * 核心算法 2：为请求参数签名
 * @param {Object} params - 原始请求参数
 * @param {string} imgKey - 从 UserStore 拿到的 img_key
 * @param {string} subKey - 从 UserStore 拿到的 sub_key
 * @returns {Object} 签名后的新参数对象
 */
export function encWbi(params, imgKey, subKey) {
  // 1. 获取混淆 Key (利用缓存)
  const mixinKey = getMixinKey(imgKey + subKey)

  // 2. 获取当前时间戳 (秒)
  const currTime = Math.round(Date.now() / 1000)
  
  // 3. 克隆参数并注入 wts
  // 注意：不要直接修改传入的 params 对象，保持纯函数特性
  const newParams = { ...params, wts: currTime }
  
  // 4. 参数排序 + 拼接字符串
  // 过滤掉不需要签名的字段 (按照 B 站规则)
  const queryStr = Object.keys(newParams)
    .sort() // 字典序排序
    .filter(key => {
      // 过滤规则：
      // 1. 是自有属性
      // 2. 这里的 value 不能是 undefined/null (但可以是 0 或 '')
      // 3. 排除 'w_rid' 本身防止死循环（虽然一般此时还没有）
      const val = newParams[key]
      return val !== undefined && val !== null && key !== 'w_rid'
    })
    .map(key => {
      // 对 value 进行转义处理
      // ⚠️ 注意：B站在这里有些特殊字符处理，但通常 encodeURIComponent 足够
      let val = newParams[key]
      // 某些极端情况如果是对象，要转字符串，但通常 API 参数都是扁平的
      if (typeof val === 'object') val = JSON.stringify(val)
      return `${key}=${encodeURIComponent(val)}`
    })
    .join('&')

  // 5. 拼接混淆 Key 并计算 MD5
  const w_rid = SparkMD5.hash(queryStr + mixinKey)

  // 6. 返回最终参数
  return { ...newParams, w_rid }
}