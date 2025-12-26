// src/utils/danmakuLoader.js
import danmakuProto from './danmakuProto.json'
import { getDanmakuSegment } from '@/api/modules/video'
// Vite 写法：导入 Worker 构造函数
import DanmakuWorker from '@/workers/danmaku.worker.js?worker'

export class DanmakuLoader {
  static async load(cid, duration) {
    console.log(`🚀 [Danmaku] 开始加载弹幕 CID:${cid}, 时长:${duration}s`)
    
    if (!cid || !duration) return []

    // 1. 计算分片数量 (每360秒一个包)
    const totalSegments = Math.ceil(duration / 360)
    const segmentIndices = Array.from({ length: totalSegments }, (_, i) => i + 1)
    
    console.log(`📦 [Danmaku] 需要加载 ${totalSegments} 个分片`)

    // 2. 并行请求所有分片
    const promises = segmentIndices.map(async (index) => {
      try {
        const response = await getDanmakuSegment(cid, index)
        
        // 3. 处理数据类型 (兼容 Capacitor 和 Web)
        let buffer = response
        
        // 如果是 JSON 对象且包含 data 字段 (某些 axios 封装可能会这样)
        if (response && response.data) {
           buffer = response.data
        }

        // 处理 CapacitorHttp 可能返回的 Base64 字符串
        if (typeof buffer === 'string') {
          // 检查是否是 Base64 (简单的正则或长度检查，或者直接尝试解码)
          // 假设 CapacitorHttp 在 responseType: 'arraybuffer' 下返回 Base64
          try {
             // 简单的 Base64 解码
             const binaryString = atob(buffer)
             const len = binaryString.length
             const bytes = new Uint8Array(len)
             for (let i = 0; i < len; i++) {
               bytes[i] = binaryString.charCodeAt(i)
             }
             buffer = bytes
          } catch (e) {
             console.warn(`⚠️ [Danmaku] 分片 ${index} 字符串解码失败，尝试直接使用`, e)
             // 如果不是 base64，可能是普通文本，这里可能会出错，但通常是 base64
          }
        } 
        // 如果已经是 ArrayBuffer，转为 Uint8Array
        else if (buffer instanceof ArrayBuffer) {
           buffer = new Uint8Array(buffer)
        }
        // 如果是 Blob (Web 环境某些情况)
        else if (buffer instanceof Blob) {
           buffer = new Uint8Array(await buffer.arrayBuffer())
        }

        if (!buffer || buffer.length === 0) {
           return []
        }

        return buffer

      } catch (error) {
        console.error(`❌ [Danmaku] 分片 ${index} 加载失败:`, error)
        return null
      }
    })

    // 4. 等待所有分片下载完成
    const segments = await Promise.all(promises)
    const validSegments = segments.filter(buffer => buffer !== null)
    
    console.log(`✅ [Danmaku] 成功下载 ${validSegments.length}/${totalSegments} 个分片`)

    // 5. 使用 Worker 并行处理所有分片
    return Promise.all(validSegments.map(buffer => {
      return new Promise((resolve) => {
        // 为每个分片启动 Worker
        const worker = new DanmakuWorker()
        
        worker.postMessage({ 
          buffer, 
          protoJson: danmakuProto 
        })

        worker.onmessage = (e) => {
          if (e.data.success) {
            resolve(e.data.data)
          } else {
            console.error(`❌ [Danmaku] Worker 处理失败:`, e.data.error)
            resolve([])
          }
          worker.terminate() // 用完即焚
        }

        worker.onerror = (error) => {
          console.error(`❌ [Danmaku] Worker 错误:`, error)
          resolve([])
          worker.terminate()
        }
      })
    })).then(results => {
      const allDanmaku = results.flat()
      // 按时间排序
      allDanmaku.sort((a, b) => a.time - b.time)
      
      console.log(`🎉 [Danmaku] 解析完成，共 ${allDanmaku.length} 条弹幕`)
      return allDanmaku
    })
  }
}
