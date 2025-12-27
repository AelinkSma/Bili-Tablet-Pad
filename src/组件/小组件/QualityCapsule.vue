<template>
  <div 
    class="quality-capsule target-box" 
    :class="{ expanded: isOpen }"
    @click.stop="toggle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 常态：显示当前画质 -->
    <div class="capsule-header">
      <span class="quality-text">{{ currentQualityText }}</span>
      <span class="capsule-icon" :class="{ rotate: isOpen }">▼</span>
    </div>
    
    <!-- 展开态：画质列表 -->
    <div class="capsule-list-wrapper">
      <ul class="quality-list">
        <li 
          v-for="q in qualityList" 
          :key="q.id"
          class="quality-item target-box"
          :class="{ active: q.id === currentQuality }"
          @click.stop="selectQuality(q.id)"
        >
          {{ q.desc }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  currentQuality: {
    type: Number,
    required: true
  },
  qualityList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['change', 'toggle'])

const isOpen = ref(false)

const currentQualityText = computed(() => {
  const find = props.qualityList.find(q => q.id === props.currentQuality)
  return find ? find.desc : '自动'
})

const toggle = () => {
  isOpen.value = !isOpen.value
  emit('toggle', isOpen.value)
}

const selectQuality = (id) => {
  if (id === props.currentQuality) return
  emit('change', id)
  isOpen.value = false
}

// 简单的鼠标交互增强
const handleMouseEnter = () => {
  // 可以在这里加额外的逻辑，目前主要靠 CSS
}
const handleMouseLeave = () => {
  if (isOpen.value) isOpen.value = false
}

defineExpose({
  toggle
})
</script>

<style scoped>
.quality-capsule {
  position: absolute; /* 由父组件定位，这里只负责自身样式 */
  width: auto;
  min-width: 80px;
  background: rgba(30, 30, 30, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  z-index: 50; /* 高于播放器 */
  transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.2s;
  /* overflow: hidden; */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* 初始状态 */
  transform-origin: top center;
}

/* 悬停/交互状态 */
.quality-capsule:hover {
  transform: scale(1.05);
  opacity: 1 !important; /* 覆盖父组件可能的透明度设置 */
}

.capsule-header {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  gap: 6px;
  white-space: nowrap;
}

.capsule-icon {
  font-size: 10px;
  transition: transform 0.3s;
  opacity: 0.7;
}

.capsule-icon.rotate {
  transform: rotate(180deg);
}

/* 列表容器：使用 scaleY 做展开动画，性能最优 */
.capsule-list-wrapper {
  background: rgba(40, 40, 40, 0.95);
  transform-origin: top;
  transform: scaleY(0);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: absolute;
  top: 36px;
  left: 0;
  right: 0;
  padding-bottom: 8px;
  border-radius: 0 0 20px 20px;
  /* 确保收起时不可见且不占位 */
  visibility: hidden; 
}

/* 展开状态 */
.quality-capsule.expanded {
  border-radius: 20px 20px 20px 20px;
  /* 当展开时，高度由内容撑开，但我们不能由 height 做动画 */
}

.quality-capsule.expanded .capsule-list-wrapper {
  transform: scaleY(1);
  visibility: visible;
  position: relative; /* 恢复流布局以撑开容器（如果不用 absolute 方案） */
  /* 由于父容器 overflow:hidden 可能截断，这里我们改用父容器的高度自适应或 absolute */
  /* 修正：如果 .quality-capsule 高度是 auto，内容出来后会自动撑开 */
  top: 0; 
}

.quality-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.quality-item {
  padding: 8px 12px;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  transition: background 0.2s, color 0.2s;
}

.quality-item:hover, .quality-item.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fb7299;
}

.quality-item:active {
  transform: scale(0.95);
}
</style>
