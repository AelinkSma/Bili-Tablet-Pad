<template>
  <div class="video-player-container">
    <div ref="artRef" class="artplayer-app"></div>

    <!-- 胶囊画质选择器 -->
    <QualityCapsule
      v-if="qualityList.length > 0"
      ref="qualityCapsuleRef"
      :current-quality="currentQuality"
      :quality-list="qualityList"
      @change="handleQualityChange"
      class="player-quality-capsule"
    />

    <div v-if="isLoading" class="loading-mask">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>{{ statusText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, watch, nextTick } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import ArtPlayer from 'artplayer'
import artplayerPluginDanmuku from 'artplayer-plugin-danmuku'
import shaka from 'shaka-player/dist/shaka-player.compiled'
import { getVideoInfo, getPlayUrl } from '@/api/modules/video'
import { DanmakuLoader } from '@/utils/danmakuLoader'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import QualityCapsule from '@/组件/小组件/QualityCapsule.vue'
import { PlayUrlBuilder } from '@/utils/playUrlBuilder'
import { BiliDashAdapter } from '@/utils/dashHelper'
import { CapacitorHttp } from '@capacitor/core'

const props = defineProps({
  video: { type: Object, required: true }
})

const appStore = useAppStore()
const userStore = useUserStore()
const artRef = ref(null)
const instance = ref(null)
const isLoading = ref(true)
const statusText = ref('初始化中...')

// 画质相关
const qualityCapsuleRef = ref(null)
const qualityList = ref([])
const currentQuality = ref(0)
const currentCid = ref(0) // 保存 CID 以便切换画质使用

// 切换画质逻辑
const handleQualityChange = async (newQn) => {
  if (!props.video?.bvid || !currentCid.value || !instance.value) return
  
  console.log(`📡 [画质切换] 正在请求画质 ID: ${newQn}`);

  try {
    instance.value.notice.show = '正在切换画质...'
    // 强制请求 DASH 格式 (fnval=4048) 以支持高画质，同时开启 4K (fourk=1)
    const playRes = await getPlayUrl(props.video.bvid, currentCid.value, { qn: newQn, fnval: 4048, fourk: 1 })
    
    // 🔍 调试：查看返回的画质详情
    console.log('🔍 [Debug] 画质切换 API 响应:', playRes.data);
    console.log('🔍 [Debug] 请求画质:', newQn, ' | 返回画质:', playRes.data.quality);
    if (playRes.data.accept_quality) {
        console.log('🔍 [Debug] 可用画质列表:', playRes.data.accept_quality);
        console.log('🔍 [Debug] 可用画质描述:', playRes.data.accept_description);
    }
    
    if (playRes.code === 0) {
      let newUrl = ''
      let playType = 'auto'

      if (playRes.data.dash?.video?.length > 0) {
        // DASH 模式
        const mpdXml = BiliDashAdapter.generateMpd(playRes.data.dash)
        const blob = new Blob([mpdXml], { type: 'application/dash+xml' })
        newUrl = URL.createObjectURL(blob)
        playType = 'dash'
      } else if (playRes.data.durl && playRes.data.durl.length > 0) {
        // MP4 模式
        newUrl = playRes.data.durl[0].url
        playType = 'mp4'
      }

      if (newUrl) {
        // 检查画质是否被降级
        const returnedQuality = playRes.data.quality
        if (returnedQuality !== newQn) {
          instance.value.notice.show = `切换失败: 服务器拒绝了该画质`
        } else {
          instance.value.notice.show = `已切换至 ${qualityList.value.find(q => q.id === newQn)?.desc || '新画质'}`
        }

        // 如果切换到 MP4 且之前有 Shaka 实例，需要销毁 Shaka
        if (playType === 'mp4' && instance.value.shaka) {
          console.log('🧹 [画质切换] 清理 Shaka 实例');
          instance.value.shaka.destroy();
          instance.value.shaka = null;
        }

        // 切换 URL 和类型
        // 注意：ArtPlayer 会根据 customType 自动销毁和重建 Shaka 实例
        instance.value.switchUrl(newUrl);
        
        // 强制更新类型（如果是 mp4 -> dash 或反之）
        instance.value.option.type = playType;

        currentQuality.value = returnedQuality
      } else {
        throw new Error('新画质地址获取失败')
      }
    }
  } catch (e) {
    console.error('切换画质失败:', e)
    instance.value.notice.show = '切换失败: ' + (e.message || '未知错误')
  }
}

// 拦截全屏下的返回操作，改为切换画质菜单
onBeforeRouteLeave((to, from, next) => {
  if (appStore.isImmersive && qualityCapsuleRef.value) {
    // 如果是沉浸模式（全屏），按返回键（触控板第一个按钮）触发胶囊切换
    qualityCapsuleRef.value.toggle()
    next(false) // 阻止路由跳转
  } else {
    next() // 允许跳转
  }
})

const initPlayer = async (bvid) => {
  if (!bvid) return
  
  if (instance.value) {
    instance.value.destroy(false)
    instance.value = null
  }

  isLoading.value = true
  statusText.value = '获取视频信息...'
  qualityList.value = [] // 重置画质列表

  try {
    const infoRes = await getVideoInfo(bvid)
    if (infoRes.code !== 0) throw new Error(infoRes.message)
    const cid = infoRes.data.cid
    const duration = infoRes.data.duration || 0
    currentCid.value = cid
    const title = infoRes.data.title || '未知视频'
    
    statusText.value = '加载弹幕与视频流...'
    
    // 并行请求
    // 使用 PlayUrlBuilder 统一构建播放地址 (支持自动降级 DASH -> MP4)
    // 使用 DanmakuLoader 加载 Protobuf 弹幕
    const [playResult, danmakuList] = await Promise.all([
      PlayUrlBuilder.build(bvid, cid),
      DanmakuLoader.load(cid, duration)
    ])

    // 解析画质列表 (从策略返回的数据中获取)
    if (playResult.accept_quality && playResult.accept_description) {
      qualityList.value = playResult.accept_quality.map((q, i) => ({
        id: q,
        desc: playResult.accept_description[i]
      }))
      currentQuality.value = playResult.quality
    }

    // 解析视频流地址
    let videoUrl = playResult.url
    let playType = playResult.type // 'dash' or 'mp4'

    console.log(`🎬 [播放器初始化] 模式: ${playType}, BVID: ${bvid}, CID: ${cid}`);
    if (playType === 'dash') {
      console.log('📦 [DASH] MPD Blob URL:', videoUrl);
    } else {
      console.log('🔗 [MP4] 直链 URL:', videoUrl);
    }

    // 解析弹幕 (已在 Loader 中处理)
    // console.log(`🎉 成功解析弹幕: ${danmakuList.length} 条`);

    nextTick(() => {
      if (!artRef.value) {
        console.error('❌ [Player] artRef is null! Initialization aborted.');
        isLoading.value = false;
        statusText.value = '播放器初始化失败(DOM)';
        return;
      }

      instance.value = new ArtPlayer({
        container: artRef.value,
        url: videoUrl,
        type: playType, // ✅ 显式告诉 ArtPlayer 这是 dash 还是 mp4
        theme: '#fb7299',
        volume: 0.5,
        autoplay: true,
        
        // 🌟 核心修复1：布局控制
        autoSize: false, // 禁止播放器自动缩放，强制填满父容器
        width: '100%',
        height: '100%',
        
        fullscreen: true,
        fullscreenWeb: true,
        
        plugins: [
          artplayerPluginDanmuku({
            danmuku: danmakuList, 
            speed: 5,
            opacity: 1,
            fontSize: 25,
            color: '#ffffff',
            realtime: false,
            points: [],
          }),
        ],

        // ✅ 核心：配置 Shaka Player 解码器
        customType: {
          dash: async (video, url, art) => {
            console.log('🚀 [Shaka] 初始化 Shaka Player...');
            
            // 1. 安装 Polyfills
            shaka.polyfill.installAll();
            if (!shaka.Player.isBrowserSupported()) {
              console.error('❌ [Shaka] 浏览器不支持 Shaka Player');
              art.notice.show = '当前浏览器不支持播放器组件';
              return;
            }

            // 2. 创建实例 (修正：分开创建和挂载，避免废弃警告)
            const player = new shaka.Player();
            await player.attach(video);
            
            // 3. 挂载到 ArtPlayer 以便销毁
            art.shaka = player;

            // 4. 🌟 核心攻坚：注册 Scheme Plugin 拦截 http/https 请求
            // 目的：使用 CapacitorHttp 发送请求，从而带上 Referer 和 User-Agent，绕过 Capacitor/WebView 的 CORS 和 Referer 限制
            const capacitorSchemePlugin = async (uri, request, requestType, progressUpdated) => {
              // console.log(`🌍 [Shaka Net] 拦截请求: ${uri}`);
              
              const headers = {
                ...request.headers,
                'Referer': `https://www.bilibili.com/video/${bvid}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              };

              // 准备 CapacitorHttp 配置
              const options = {
                url: uri,
                method: request.method || 'GET',
                headers: headers,
                // 关键：请求二进制数据
                responseType: 'arraybuffer'
              };

              if (request.body) {
                options.data = request.body;
              }

              try {
                const response = await CapacitorHttp.request(options);
                
                // 处理数据：CapacitorHttp (Android) 对于 arraybuffer 通常返回 base64 字符串
                let responseData = response.data;
                if (typeof responseData === 'string') {
                  const binaryString = atob(responseData);
                  const len = binaryString.length;
                  const bytes = new Uint8Array(len);
                  for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  responseData = bytes.buffer;
                }

                return {
                  uri: response.url || uri,
                  data: responseData,
                  headers: response.headers || {},
                  status: response.status,
                  timeMs: 0 
                };
              } catch (error) {
                console.error(`❌ [Shaka Net] 请求失败: ${uri}`, error);
                throw new shaka.util.Error(
                  shaka.util.Error.Severity.CRITICAL,
                  shaka.util.Error.Category.NETWORK,
                  shaka.util.Error.Code.BAD_HTTP_STATUS,
                  uri,
                  error.message
                );
              }
            };

            // 注册插件接管 http 和 https (修正：使用静态方法注册)
            shaka.net.NetworkingEngine.registerScheme('http', capacitorSchemePlugin);
            shaka.net.NetworkingEngine.registerScheme('https', capacitorSchemePlugin);
            console.log('🛡️ [Shaka] 网络拦截器已注册 (CapacitorHttp)');

            // 5. 错误处理
            player.addEventListener('error', (event) => {
              console.error('❌ [Shaka Error]', event.detail);
              art.notice.show = `播放错误: ${event.detail.code}`;
            });

            // 6. 加载视频
            player.load(url).then(() => {
              console.log('✅ [Shaka] 视频加载成功');
            }).catch((e) => {
              console.error('❌ [Shaka] 视频加载失败', e);
              art.notice.show = '视频加载失败';
            });

            // 7. 销毁逻辑
            art.on('destroy', () => {
              console.log('🧹 [Shaka] 销毁实例');
              player.destroy();
              art.shaka = null;
            });
          }
        },

        // 其他配置
        setting: true,
        pip: true,
        playbackRate: true,
        aspectRatio: true,
        // 手机/平板端优化：锁定方向
        lock: true,
        fastForward: true, 
      })
      
      isLoading.value = false
    })

  } catch (e) {
    console.error('播放初始化失败:', e)
    statusText.value = '加载失败: ' + (e.message || '未知错误')
    // 即使失败保留遮罩，显示错误信息
  }
}

// watch(() => props.video?.bvid, (newVal) => {
//   if (newVal) initPlayer(newVal)
// }, { immediate: true })
// 修改 watch 逻辑，增加去重判断
watch(() => props.video?.bvid, (newVal, oldVal) => {
  // 🚫 防抖：只有 BVID 真正变化，且不为空时才初始化
  if (newVal && newVal !== oldVal) {
    initPlayer(newVal)
  }
}, { immediate: true })

// 监听触控板发来的指令
watch(() => appStore.videoCommand, (cmd) => {
  if (!cmd || !instance.value) return;
  
  // 简单的防抖或校验逻辑可以放在 Store 里，或者这里校验 timestamp
  const now = Date.now();
  if (now - cmd.timestamp > 1000) return; // 忽略太旧的指令

  switch (cmd.type) {
    case 'togglePlay':
      instance.value.toggle();
      break;
    case 'seek':
      instance.value.seek = instance.value.currentTime + cmd.payload;
      instance.value.notice.show = `快${cmd.payload > 0 ? '进' : '退'} ${Math.abs(cmd.payload)}s`;
      break;
  }
});

onBeforeUnmount(() => {
  if (instance.value) {
    instance.value.destroy(false)
  }
})
</script>

<style scoped>
.video-player-container {
  width: 100%;
  height: 100%;
  background: #000;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  
  /* 🌟 核心修复3：使用 Flex 居中 */
  /* 这确保无论视频尺寸如何，播放器容器始终居中 */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1; /* 确保建立层级上下文 */
}

.artplayer-app {
  /* 强制填满容器，让 ArtPlayer 自己去处理视频的 letterbox (黑边) */
  width: 100% !important;
  height: 100% !important;
}

.loading-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  /* backdrop-filter: blur(10px); */
}

.loading-content {
  text-align: center;
  color: #fff;
}

.spinner {
  width: 40px; height: 40px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top-color: #fb7299;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.player-quality-capsule {
  position: absolute;
  top: 24px;
  right: 24px;
  opacity: 0.6;
  z-index: 100; /* 强制提升到最高，确保在 ArtPlayer 控件之上 */
  opacity: 1 !important; /* 确保不透明 */
  pointer-events: auto; /* 确保可点击 */
}

</style>



<style>

/* 针对 ArtPlayer 内部控件的全局样式覆盖 */

.art-controls-right {

  /* 允许换行 */

  flex-wrap: wrap !important;

  /* 从右边开始排列 */

  justify-content: flex-end !important;

}



/* 适当减小右侧每个按钮的水平间距 */

.art-controls-right > .art-control:not(:last-child) {

  margin-right: 5px !important;

}

/* 🚀 弹幕样式优化 */
.art-danmuku-node {
  /* 强制无背景和边框，解决“灰色背景框”问题 */
  background-color: transparent !important;
  border: none !important; 
  
  /* 高性能文字描边 (GPU 加速更友好) */
  text-shadow: 
    1px 0 1px rgba(0,0,0,0.8), 
    0 1px 1px rgba(0,0,0,0.8), 
    0 -1px 1px rgba(0,0,0,0.8), 
    -1px 0 1px rgba(0,0,0,0.8) !important;
    
  /* 优化字体渲染 */
  font-family: sans-serif;
  font-weight: bold;
}
</style>
