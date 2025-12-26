import { useUserStore } from '@/stores/user';
import { useSettingsStore } from '@/stores/settings'; // 预留，供未来扩展
import { VideoStrategyFactory, Mp4Strategy } from './videoStrategies';
import { getPlayUrl } from '@/api/modules/video';
// 引入 Worker
import DashWorker from '@/workers/dash.worker.js?worker';

export class PlayUrlBuilder {
  static async build(bvid, cid) {
    const userStore = useUserStore();
    const settingsStore = useSettingsStore(); 

    const isLogin = userStore.isLoggedIn;
    // 直接使用 Store Getter，保持逻辑统一
    const isVip = userStore.isVip;

    // 🛠️ 1. 确定目标画质 (天花板策略)
    let targetQn = 64; // 默认/游客 720P
    if (isLogin) {
      targetQn = settingsStore.preferredQuality || 80;
    } else {
      // 游客强制限制
      targetQn = 64;
    }

    // 🛠️ 2. 构建请求参数
    const requestParams = {
      qn: targetQn
    };

    // 4K 开关逻辑：如果目标画质 > 1080P，必须显式请求 fourk=1
    if (targetQn > 80) {
      requestParams.fourk = 1;
    }

    // 🚀 核心优化：直接发起网络请求，然后使用 Worker 处理
    try {
      console.log(`[PlayUrlBuilder] Direct API call with qn=${targetQn}`);
      
      // 发起网络请求 (这是 IO 操作，不阻塞主线程)
      const res = await getPlayUrl(bvid, cid, requestParams);
      const data = res.data || res.result;

      if (data.dash) {
        // 🚀 核心优化：启动 Worker 生成 XML
        const mpdXml = await new Promise((resolve, reject) => {
          const worker = new DashWorker();
          
          worker.postMessage({ dashData: data.dash });
          
          worker.onmessage = (e) => {
            if (e.data.success) {
              resolve(e.data.xml);
            } else {
              // 如果 Worker 失败，降级回主线程或者报错
              console.error('Worker MPD generation failed:', e.data.error);
              reject(e.data.error);
            }
            worker.terminate(); // 用完即焚
          };
          
          worker.onerror = (err) => {
            reject(err);
            worker.terminate();
          };
        });

        // 主线程只负责轻量的 Blob 创建
        const blob = new Blob([mpdXml], { type: 'application/dash+xml' });
        const blobUrl = URL.createObjectURL(blob);

        return {
          type: 'dash',
          url: blobUrl,
          quality: data.quality,
          acceptFormats: data.accept_format,
          acceptDescription: data.accept_description,
          acceptQuality: data.accept_quality,
          originalData: data
        };
      } 
      
      // MP4 处理逻辑保持不变 ...
      if (data.durl && data.durl.length > 0) {
        const mp4Strategy = new Mp4Strategy();
        const mp4Result = await mp4Strategy.processDirectData(data);
        return mp4Result;
      }

      throw new Error('No valid video data found');

    } catch (error) {
      console.warn(`[PlayUrlBuilder] Direct approach failed:`, error);

      // 🚀 降级处理：如果 Worker 方式失败，降级到传统策略模式
      console.log('[PlayUrlBuilder] Falling back to strategy pattern...');
      
      // 获取首选策略 (通常：已登录->DASH，未登录->MP4)
      let strategy = VideoStrategyFactory.create(isLogin, isVip);
      let strategyName = isLogin ? 'DASH' : 'MP4';

      try {
        console.log(`[PlayUrlBuilder] Trying fallback strategy: ${strategyName} with qn=${targetQn}`);
        const result = await strategy.resolve(bvid, cid, requestParams);
        return {
          ...result,
          _isFallback: true // 标记位，UI 可据此提示"已切换至兼容模式"
        };

      } catch (fallbackError) {
        console.error(`[PlayUrlBuilder] Fallback strategy ${strategyName} also failed:`, fallbackError);

        // 如果首选不是 MP4，最后尝试 MP4
        if (strategyName !== 'MP4') {
          console.log('[PlayUrlBuilder] Final fallback to MP4 strategy...');
          try {
            const finalStrategy = new Mp4Strategy();
            const finalResult = await finalStrategy.resolve(bvid, cid, requestParams);
            return {
              ...finalResult,
              _isFallback: true
            };
          } catch (finalError) {
            console.error('[PlayUrlBuilder] All strategies failed:', finalError);
            throw finalError;
          }
        }

        throw fallbackError;
      }
    }
  }
}
