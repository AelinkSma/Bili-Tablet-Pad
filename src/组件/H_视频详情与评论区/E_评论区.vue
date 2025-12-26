<template>
  <div class="comments-container scroll-part">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>正在加载评论...</span>
    </div>

    <div v-else-if="list.length === 0" class="empty-state">
      暂无评论或加载失败
    </div>

    <div v-else class="comment-list">
      <div v-for="item in list" :key="item.rpid" class="comment-item target-box">
        <div class="avatar">
          <BiliImage :src="item.member.avatar" width="36px" height="36px" fit="cover" />
        </div>
        <div class="content">
          <div class="user-row">
            <span class="uname" :class="{ vip: item.member.vip?.status }">{{ item.member.uname }}</span>
            <span class="lvl">LV{{ item.member.level_info.current_level }}</span>
          </div>
          <div class="text" v-html="formatContent(item.content.message)"></div>
          <div class="meta">
            <span>{{ formatDate(item.ctime) }}</span>
            <span>👍 {{ item.like }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { getVideoComments } from '@/api/modules/video'
import BiliImage from '@/组件/小组件/BiliImage.vue'

const appStore = useAppStore()
const list = ref([])
const loading = ref(true)

const loadData = async () => {
  const current = appStore.currentVideo
  if (!current || !current.aid) {
    loading.value = false
    return
  }

  const cacheKey = `comments-${current.aid}-page1`
  let res = null

  try {
    loading.value = true
    
    // 1. 尝试从预热缓存获取
    const preloadPromise = appStore.consumePreload(cacheKey)
    if (preloadPromise) {
      console.log('⚡ [Comments] 命中预热缓存')
      res = await preloadPromise
    } else {
      // 2. 如果没有预热，现场请求
      console.log('🐢 [Comments] 现场请求')
      res = await getVideoComments(current.aid)
    }

    if (res && res.code === 0) {
      // 提取热门评论或普通评论
      // replies 是置顶/热门，如果为空可能在 data.replies
      list.value = res.data.replies || []
    }
  } catch (e) {
    console.error('加载评论失败', e)
  } finally {
    loading.value = false
  }
}

const formatContent = (text) => {
  // 简单处理表情转义等，暂原样输出
  return text.replace(/\n/g, '<br/>')
}

const formatDate = (ts) => {
  return new Date(ts * 1000).toLocaleDateString()
}

onMounted(() => {
  loadData()
})

// 监听视频变化重新加载
watch(() => appStore.currentVideo?.aid, (val) => {
  if (val) loadData()
})
</script>

<style scoped>
/* 滚动条部分保持原样 */
.comments-container { height: 100%; overflow-y: auto; padding: 12px; }

/* ❌ color: #999 -> ✅ var(--text-muted) */
.loading-state, .empty-state { padding: 40px; text-align: center; color: var(--text-muted); }

/* loading 边框颜色适配 */
.spinner { 
  width: 24px; height: 24px; 
  /* ❌ border: 3px solid rgba(0,0,0,0.1); */
  border: 3px solid var(--border-base);
  border-top-color: #fb7299; /* 主题色通常保留，或者用 var(--primary-color) */
  border-radius: 50%; 
  animation: spin 0.8s linear infinite; 
  margin: 0 auto 10px; 
}
@keyframes spin { to { transform: rotate(360deg); } }

.comment-item { 
  display: flex; 
  gap: 10px; 
  margin-bottom: 16px; 
  padding-bottom: 16px; 
  /* ❌ border-bottom: 1px solid rgba(0,0,0,0.05); */
  /* ✅ 使用通用边框变量 (深色模式下会自动变浅白) */
  border-bottom: 1px solid var(--border-base); 
}

.avatar { flex-shrink: 0; border-radius: 50%; overflow: hidden; width: 36px; height: 36px; }
.content { flex: 1; min-width: 0; }

.user-row { 
  font-size: 13px; 
  font-weight: bold; 
  /* ❌ color: #666 -> ✅ var(--text-sub) */
  color: var(--text-sub); 
  margin-bottom: 4px; 
  display: flex; 
  align-items: center; 
  gap: 6px; 
}

.uname.vip { color: #fb7299; }
.lvl { font-size: 9px; background: #ddd; color: #fff; padding: 0 4px; border-radius: 2px; }

.text { 
  font-size: 14px; 
  /* ❌ color: #333 -> ✅ var(--text-main) */
  color: var(--text-main); 
  line-height: 1.5; 
  margin-bottom: 6px; 
  word-wrap: break-word; 
}

.meta { 
  font-size: 11px; 
  /* ❌ color: #999 -> ✅ var(--text-muted) */
  color: var(--text-muted); 
  display: flex; 
  gap: 12px; 
}
</style>