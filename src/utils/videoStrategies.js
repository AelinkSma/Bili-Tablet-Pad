import { getPlayUrl } from '@/api/modules/video';
import { BiliDashAdapter } from './dashHelper';

/**
 * 视频源获取策略接口 (抽象基类)
 */
export class IVideoSourceStrategy {
  /**
   * 解析视频播放地址
   * @param {string} bvid 
   * @param {number} cid 
   * @param {object} options - 额外请求参数(qn, fourk等)
   * @returns {Promise<{type: string, url: string, quality: number}>}
   */
  async resolve(bvid, cid, options = {}) {
    throw new Error('Method not implemented.');
  }
}

/**
 * MP4 策略
 * 适用于：未登录用户、不支持 MSE 的环境
 * 特点：直接请求 MP4 地址，兼容性最好，但清晰度有限 (最高 1080P/720P)
 */
export class Mp4Strategy extends IVideoSourceStrategy {
  async resolve(bvid, cid, options = {}) {
    // MP4 策略通常不需要高级参数，但为了兼容性透传 options
    // 注意：getPlayUrl 内部会强制 fnval=1 覆盖 options 中的 fnval
    const res = await getPlayUrl(bvid, cid, { ...options, fnval: 1 });
    
    // 🔧 修复点 1：request.js 已经解包过一次，这里直接取 res.data 即可
    const data = res.data || res.result; 

    if (!data || !data.durl || data.durl.length === 0) {
      throw new Error('MP4 url not found');
    }

    const durlItem = data.durl[0];
    
    return {
      type: 'mp4',
      url: durlItem.url,
      quality: data.quality || 0,
      accept_quality: data.accept_quality,
      accept_description: data.accept_description,
      backupUrl: durlItem.backup_url
    };
  }
}

/**
 * DASH 策略
 * 适用于：已登录用户、现代浏览器
 * 特点：支持高画质 (1080P+、4K)、高帧率，需要前端通过 MSE 播放
 */
export class DashStrategy extends IVideoSourceStrategy {
  async resolve(bvid, cid, options = {}) {
    const supportHevc = await this._checkHevcSupport();
    const fnval = supportHevc ? 4048 : 16;
    // console.log('🧪 [DashStrategy] Forcing H.264 (fnval=16) for debugging...');
    // const fnval = 16; 

    // ✨ 启用 4K 请求 (fourk: 1)
    // 合并传入的 options (包含 qn 等)
    const res = await getPlayUrl(bvid, cid, { fnval, fourk: 1, ...options });
    
    // 🔧 修复点 2：同样的修正
    const data = res.data || res.result;

    if (!data || !data.dash) {
      console.warn('DASH data missing, falling back to MP4 strategy logic implicitly or throwing.');
      // 降级检查：如果 DASH 请求返回了 durl (比如服务端强制降级)
      if (data && data.durl) {
        return {
          type: 'mp4',
          url: data.durl[0].url,
          quality: data.quality,
          accept_quality: data.accept_quality,
          accept_description: data.accept_description,
        };
      }
      throw new Error('No DASH or MP4 data found');
    }

    const mpdXml = BiliDashAdapter.generateMpd(data.dash);
    const blob = new Blob([mpdXml], { type: 'application/dash+xml' });
    const blobUrl = URL.createObjectURL(blob);

    return {
      type: 'dash',
      url: blobUrl,
      quality: data.quality,
      accept_quality: data.accept_quality,
      accept_description: data.accept_description,
      rawDash: data.dash
    };
  }
  
  // ... _checkHevcSupport 保持不变 ...
  async _checkHevcSupport() {
    // ... 代码略 ...
    if (!navigator.mediaCapabilities) return false;
    try {
      const config = {
        type: 'media-source', 
        video: {
          contentType: 'video/mp4; codecs="hvc1.1.6.L120.B0"',
          width: 1920,
          height: 1080,
          bitrate: 2000000,
          framerate: 30
        }
      };
      const info = await navigator.mediaCapabilities.decodingInfo(config);
      return info.supported;
    } catch (e) {
      return false;
    }
  }
}

// ... VideoStrategyFactory 保持不变 ...
export class VideoStrategyFactory {
  static create(isLogin, isVip = false) {
    if (isLogin) {
      return new DashStrategy();
    } else {
      return new Mp4Strategy();
    }
  }
}
