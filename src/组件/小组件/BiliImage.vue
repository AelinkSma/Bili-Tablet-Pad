<template>
  <div class="bili-image-container" :style="{ width, height }">
    <img 
      v-if="finalUrl && !isError"
      :src="finalUrl"
      :style="{ objectFit: fit }"
      class="real-image"
      loading="lazy"
      referrerpolicy="no-referrer"
      @load="isLoading = false"
      @error="handleError"
    />

    <div v-if="isLoading" class="skeleton"></div>

    <div v-if="isError" class="error-placeholder">
      <span>🚫</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  width: { type: String, default: '100%' },
  height: { type: String, default: '100%' },
  fit: { type: String, default: 'cover' }
})

const isLoading = ref(true)
const isError = ref(false)

// ✅ 简单的 URL 处理：确保是 HTTPS
const finalUrl = computed(() => {
  if (!props.src) return ''
  let url = props.src
  // 补全协议
  if (url.startsWith('//')) {
    url = 'https:' + url
  }
  // 强制 HTTPS (解决安卓 WebView 混合内容报错)
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://')
  }
  return url
})

const handleError = () => {
  isError.value = true
  isLoading.value = false
}

// 监听 src 变化重置状态
watch(() => props.src, () => {
  isLoading.value = true
  isError.value = false
})
</script>

<style scoped>
.bili-image-container {
  position: relative;
  overflow: hidden;
  background-color: #f0f0f0;
  border-radius: inherit;
  display: flex;
}

.real-image {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: inherit;
  /* 优化图片渲染 */
  will-change: transform; 
}

.skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.error-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e6e6e6;
  color: #999;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>