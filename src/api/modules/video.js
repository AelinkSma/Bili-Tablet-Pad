/* src/api/modules/video.js */
import request from '@/api/request'

export const getPopularVideos = (pn = 1, ps = 20) => {
  return request({
    url: '/x/web-interface/popular',
    method: 'GET',
    params: { pn, ps }
  })
}

export const getVideoInfo = (bvid) => {
  return request({
    url: '/x/web-interface/view',
    method: 'GET',
    params: { bvid }
  })
}

export const getPlayUrl = (bvid, cid, options = {}) => {
  return request({
    url: '/x/player/playurl',
    method: 'GET',
    // 🔥 关键修复：动态设置 Referer 为具体视频页面
    headers: {
      'Referer': `https://www.bilibili.com/video/${bvid}`
    },
    params: {
      useWbi: true, // ✨ 启用 Wbi 签名，解决登录后高画质鉴权失败问题
      bvid,
      cid,
      qn: 64, // 720P
      
      // 👇 降级策略：改为 1 (MP4格式)，放弃 16 (DASH)
      // 原因：游客请求 DASH 极易触发 412，MP4 成功率极高
      fnval: 1, 
      fnver: 0,
      fourk: 0,
      platform: 'pc',
      high_quality: 1,
      ...options
    }
  })
}

export const getDanmaku = (cid) => {
  return request({
    url: `https://comment.bilibili.com/${cid}.xml`,
    method: 'GET',
    responseType: 'text',
    headers: {}
  })
}

export const getDanmakuSegment = (cid, segment_index) => {
  return request({
    url: '/x/v2/dm/web/seg.so',
    method: 'GET',
    params: {
      type: 1,
      oid: cid,
      segment_index
    },
    responseType: 'arraybuffer'
  })
}

// ✨ 新增：获取分区视频列表
// rid: 分区ID (如 1=动画, 4=游戏)
export const getRegionVideos = (rid, pn = 1, ps = 20) => {
  return request({
    url: '/x/web-interface/dynamic/region',
    method: 'GET',
    params: { 
      rid, 
      pn, 
      ps 
    }
  })
}

// 获取视频评论
// type: 1 (视频), oid: av号 (注意不是BV号，需要 aid)
// sort: 0=按时间, 1=按点赞, 2=热门
export const getVideoComments = (aid, next = 0, sort = 1) => {
  return request({
    url: '/x/v2/reply/main', // 使用 main 接口获取主楼评论
    method: 'GET',
    params: {
      type: 1,
      oid: aid,
      mode: 3, // 3=热门
      plat: 1,
      next: next // 页码/游标
    }
  })
}