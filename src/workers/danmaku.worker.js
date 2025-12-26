// src/workers/danmaku.worker.js
import protobuf from 'protobufjs'
// 这里需要处理一下 proto json 的引入，或者直接把 json 内容硬编码进来/传进来
// 假设你把 danmakuProto.json 的内容传进来了，或者在这个 worker 里能 import

self.onmessage = async (e) => {
  const { buffer, protoJson } = e.data

  try {
    const root = protobuf.Root.fromJSON(protoJson)
    const DmSegMobileReply = root.lookupType('DmSegMobileReply')
    
    // 1. 解码
    const message = DmSegMobileReply.decode(new Uint8Array(buffer))
    const object = DmSegMobileReply.toObject(message, {
      longs: String,
      enums: String,
      bytes: String,
    })

    // 2. 转换格式 (纯计算，非常适合 Worker)
    const list = (object.elems || []).map(elem => {
      let mode = 0
      if (elem.mode === 4) mode = 2
      else if (elem.mode === 5) mode = 1
      const color = '#' + (elem.color || 16777215).toString(16).padStart(6, '0')
      return {
        text: elem.content,
        time: elem.progress / 1000,
        mode: mode,
        color: color,
        border: false,
        uid: elem.midHash,
        date: elem.ctime
      }
    })

    // 3. 发回主线程
    self.postMessage({ success: true, data: list })

  } catch (err) {
    self.postMessage({ success: false, error: err.message })
  }
}