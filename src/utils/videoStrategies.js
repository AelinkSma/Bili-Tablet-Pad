// src/utils/videoStrategies.js
import { getPlayUrl } from '@/api/modules/video';
import { BiliDashAdapter } from './dashHelper';

export class IVideoSourceStrategy {
  async resolve(bvid, cid, options = {}) {
    throw new Error('Method not implemented.');
  }
}

export class Mp4Strategy extends IVideoSourceStrategy {
  async resolve(bvid, cid, options = {}) {
    const res = await getPlayUrl(bvid, cid, { ...options, fnval: 1 });
    const data = res.data || res.result; 

    if (!data || !data.durl || data.durl.length === 0) {
      throw new Error('MP4 url not found');
    }

    // 复用提取逻辑
    return this.processDirectData(data);
  }

  // ✨✨✨ 新增这个缺失的方法 ✨✨✨
  processDirectData(data) {
    if (!data || !data.durl || data.durl.length === 0) {
      throw new Error('MP4 data is invalid');
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

export class DashStrategy extends IVideoSourceStrategy {
    // ... DashStrategy 保持不变 ...
    async resolve(bvid, cid, options = {}) {
        const supportHevc = await this._checkHevcSupport();
        const fnval = supportHevc ? 4048 : 16;
        const res = await getPlayUrl(bvid, cid, { fnval, fourk: 1, ...options });
        const data = res.data || res.result;

        if (!data || !data.dash) {
             // 简单的降级检查
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
    
    // ... _checkHevcSupport ...
    async _checkHevcSupport() {
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

export class VideoStrategyFactory {
  static create(isLogin, isVip = false) {
    if (isLogin) {
      return new DashStrategy();
    } else {
      return new Mp4Strategy();
    }
  }
}