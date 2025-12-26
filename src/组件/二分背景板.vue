<!-- 已弃用 -->
<!--
<template>
  <div class="layout-container">
    <div class="matte-background"></div>

    <el-splitter 
      class="my-splitter" 
      :class="{ 'dragging-mode': isDragging }"
      @resize-start="onDragStart"
      @resize-end="onDragEnd"
    >
      
      <el-splitter-panel 
        v-model:size="leftPanelSize" 
        :min="0" 
        class="smooth-panel left-panel-wrapper"
      >
        <div class="content-card left-card">
          <div class="card-inner">
            <slot name="sidebar">
              <div class="empty-tip">左侧内容区域</div>
            </slot>
          </div>
        </div>
      </el-splitter-panel>

      <el-splitter-panel class="smooth-panel right-panel-wrapper" :min="0">
        
        <div 
          class="toggle-btn" 
          :class="{ 'is-collapsed': isCollapsed }"
          @click="toggleSidebar"
        >
          <el-icon><ArrowLeft /></el-icon>
        </div>

        <div class="content-card right-card">
          <div class="card-inner">
             <slot>
               <div class="empty-tip">右侧主内容区域</div>
             </slot>
          </div>
        </div>
      </el-splitter-panel>

    </el-splitter>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'

// 允许父组件传入初始宽度，默认 24%
const props = defineProps({
  initialWidth: { type: String, default: '24%' }
})

const leftPanelSize = ref(props.initialWidth)
const isDragging = ref(false)

const isCollapsed = computed(() => parseInt(String(leftPanelSize.value)) === 0)
const onDragStart = () => isDragging.value = true
const onDragEnd = () => isDragging.value = false

const toggleSidebar = () => {
  if (isCollapsed.value) {
    leftPanelSize.value = props.initialWidth
  } else {
    leftPanelSize.value = '0%'
  }
}
</script>

<style scoped>
/* 全局设置 */
:global(body) {
  margin: 0; padding: 0; 
  width: 100vw; 
  height: 100vh; /* 兼容旧设备 */
  height: 100dvh; /* 动态视口高度，解决移动端地址栏/UI栏伸缩问题 */
  overflow: hidden; /* 禁止整个页面滚动，只允许组件内部滚动 */
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  
  /* 禁用 iOS/Android 点击高亮和橡皮筋效果 */
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior: none; 
}
.layout-container {
  /* 强制占满视口 */
  width: 100vw;
  height: 100vh;
  /* height: 100dvh; */
  background-color: #eef2f6;
  position: relative;

  /* 📦 核心修复：使用 max() 强制避让 */
  
  /* 顶部：至少保留 35px，防止撞到状态栏时间 */
  /* padding-top: max(10px, env(safe-area-inset-top)); 
  
  /* 底部：至少保留 25px，防止被虚拟按键/小横条遮挡 */
  /* padding-bottom: max(65px, env(safe-area-inset-bottom));  */
  
  /* 左右：横屏时的避让 */
  /* padding-left: max(10px, env(safe-area-inset-left));
  padding-right: max(10px, env(safe-area-inset-right)); */

  padding: 0;
  box-sizing: border-box; /* 关键：让 padding 包含在 height 内，防止撑破屏幕 */
  
  display: flex;
  flex-direction: column;
}
.app-container {
  height: 100vh;
  width: 100vw;
  background-color: #eef2f6;
  position: relative;
}

.matte-background { 
  position: absolute; inset: 0; 
  background-image: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, rgba(230,235,240,0.5) 100%); 
  pointer-events: none; 
  z-index: 0; 
}
/* 修复 splitter 高度，让它填满减去 padding 后的剩余空间 */
.my-splitter { 
  flex: 1;           /* 自动占据剩余高度 */
  width: 100%; 
  min-height: 0;     /* 防止 flex 子元素溢出 */
  position: relative; 
  z-index: 1; 
  border: none !important; 
}
/* =========================================
   🔧 关键修复：定义 right-panel-wrapper
   ========================================= */
/* 如果不加这个，按钮就会飞到屏幕最左边。
   这里我们使用了 :deep() 确保样式能穿透到 element-plus 组件的根元素上。
*/
:deep(.right-panel-wrapper) { position: relative !important; overflow: visible !important; display: flex; min-width: 0;}
:deep(.left-panel-wrapper) { position: relative; display: flex; }
:deep(.el-splitter-panel.smooth-panel) { transition: flex-basis 0.6s cubic-bezier(0.25, 0.8, 0.25, 1); height: 100%; }
.my-splitter.dragging-mode :deep(.el-splitter-panel.smooth-panel) { transition: none !important; }
/* =========================================
   🎛 按钮 (现在它能找到 .right-panel-wrapper 了)
   ========================================= */
.toggle-btn { position: absolute; left: 0; top: 50%; transform: translate(-50%, -50%); z-index: 200; width: 24px; height: 48px; border-radius: 99px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 1); display: flex; align-items: center; justify-content: center; cursor: pointer; color: #909399; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toggle-btn:hover { width: 32px; height: 56px; background-color: #ffffff; color: #409eff; box-shadow: 0 8px 24px rgba(64, 158, 255, 0.25), 0 0 0 1px rgba(64, 158, 255, 0.1); }
.toggle-btn.is-collapsed { left: 12px; }
.toggle-btn.is-collapsed .el-icon { transform: rotate(180deg); }
.toggle-btn .el-icon { transition: transform 0.5s; }
/* =========================================
   卡片与 Resizer 样式 (保持优美)
   ========================================= */
/* 卡片样式 */
.content-card { 
  flex: 1; 
  border-radius: 20px; 
  background-color: rgba(255, 255, 255, 0.85); 
  backdrop-filter: blur(20px); 
  box-shadow: 0 4px 6px rgba(0,0,0,0.02), 0 10px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.8); 
  display: flex; 
  flex-direction: column; 
  overflow: hidden; 
  min-width: 0;
  transition: transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.3s, margin 0.3s; 
}
.left-card { margin: 16px 12px 16px 16px; }
.right-card { margin: 16px 16px 16px 12px; }
.my-splitter.dragging-mode .content-card { transform: scale(0.985); opacity: 0.9; }

/* 内部容器 */
.card-inner { 
  flex: 1; /* 确保占满卡片高度 */
  height: 100%; 
  box-sizing: border-box; 
  width: 100%; 
  overflow-y: auto; 
  scrollbar-width: none; 
  -ms-overflow-style: none;
}
.gradient-text {
  background: linear-gradient(120deg, #1f2937, #6b7280);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.dummy-nav-item {
  height: 40px; width: 100%; border-radius: 8px; margin-top: 12px;
  border: 1px dashed #e5e7eb;
}
.dummy-nav-item.active { background: linear-gradient(90deg, #f3f4f6 0%, transparent 100%); border: none; }

.glass-component {
  margin-top: 30px; padding: 24px;
  background: linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1));
  border: 1px solid rgba(255,255,255,0.5); border-radius: 16px;
  color: #5e6d82; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
}

.status-active { color: #409eff; text-shadow: 0 0 10px rgba(64,158,255,0.4); }

/* Resizer 美化 */
:deep(.el-splitter__resizer) { background-color: transparent !important; width: 20px !important; margin-left: -10px !important; z-index: 100; position: relative; }
:deep(.el-splitter__resizer::after) { content: ''; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); height: 40px; width: 4px; border-radius: 10px; background-color: #c0c4cc; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
:deep(.el-splitter__resizer:hover::after) { height: 60px; background-color: #409eff; box-shadow: 0 0 8px rgba(64, 158, 255, 0.4); }
.my-splitter.dragging-mode :deep(.el-splitter__resizer::after) { height: 100vh; width: 2px; background-color: #409eff; box-shadow: 0 0 20px rgba(64, 158, 255, 0.5), 0 0 40px rgba(64, 158, 255, 0.3); opacity: 0.8; }
</style>
-->