import { useUserStore } from '@/stores/user';
import { useSettingsStore } from '@/stores/settings';
import { VideoStrategyFactory, Mp4Strategy } from './videoStrategies';
import { getPlayUrl } from '@/api/modules/video';
import DashWorker from '@/workers/dash.worker.js?worker';

export class PlayUrlBuilder {
  static async build(bvid, cid) {
    const userStore = useUserStore();
    const settingsStore = useSettingsStore();

    const isLogin = userStore.isLoggedIn;
    
    // 🛠️ 1. 确定目标画质
    // 即使是游客，也尝试请求高一点的参数，B站会自动降级返回可用的最高画质
    let targetQn = isLogin ? (settingsStore.preferredQuality || 80) : 64;

    // 🛠️ 2. 构建请求参数
    // 🔴 核心修改：无论是否登录，强制使用 fnval=4048 (DASH 格式)
    // 只有 DASH 格式才能通过 Shaka Player 拦截器注入 Referer，从而绕过 403
    const requestParams = {
      qn: targetQn,
      fnval: 4048, // 强制请求 DASH
      fourk: targetQn > 80 ? 1 : 0
    };

    try {
      console.log(`[PlayUrlBuilder] Requesting video stream: qn=${targetQn}, fnval=${requestParams.fnval}`);
      
      const res = await getPlayUrl(bvid, cid, requestParams);
      const data = res.data || res.result;

      // 🔍 调试信息
      if (data.dash) {
        console.log('✅ [PlayUrlBuilder] Got DASH data');
      } else if (data.durl) {
        console.warn('⚠️ [PlayUrlBuilder] API returned MP4 (durl) instead of DASH. This might cause 403 errors.');
      }

      // === 分支 A: DASH 处理 (首选) ===
      if (data.dash) {
        const mpdXml = await new Promise((resolve, reject) => {
          const worker = new DashWorker();
          worker.postMessage({ dashData: data.dash });
          worker.onmessage = (e) => {
            if (e.data.success) resolve(e.data.xml);
            else reject(e.data.error);
            worker.terminate();
          };
          worker.onerror = (err) => {
            reject(err);
            worker.terminate();
          };
        });

        const blob = new Blob([mpdXml], { type: 'application/dash+xml' });
        const blobUrl = URL.createObjectURL(blob);

        return {
          type: 'dash', // 告诉播放器使用 Shaka
          url: blobUrl,
          quality: data.quality,
          accept_quality: data.accept_quality || [],
          accept_description: data.accept_description || [],
          acceptFormats: data.accept_format,
          acceptDescription: data.accept_description,
          acceptQuality: data.accept_quality,
          originalData: data
        };
      } 
      
      // === 分支 B: MP4 处理 (仅当 API 坚决不给 DASH 时) ===
      // 注意：这在原生 App 上极大概率会 403，但作为最后的保底保留
      if (data.durl && data.durl.length > 0) {
        console.warn('⚠️ [PlayUrlBuilder] Fallback to MP4 strategy. Referer header will be missing!');
        const mp4Strategy = new Mp4Strategy();
        // 确保你在 videoStrategies.js 里加了 processDirectData 方法，否则这里会报错
        // 如果没加，请参考上一条回答修复 videoStrategies.js
        if (typeof mp4Strategy.processDirectData === 'function') {
           return mp4Strategy.processDirectData(data);
        } else {
           // 简单的临时处理，防止报错
           return {
              type: 'mp4',
              url: data.durl[0].url,
              quality: data.quality
           }
        }
      }

      throw new Error('No valid video data found (Neither DASH nor MP4)');

    } catch (error) {
      console.warn(`[PlayUrlBuilder] Error building play url:`, error);
      throw error;
    }
  }
}