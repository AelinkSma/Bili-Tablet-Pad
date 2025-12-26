<template>
  <div id="virtual-cursor" 
       ref="cursorRef" 
       :class="{ hidden: appStore.isImmersive }">
  </div>

  <div id="highlight-box" 
       ref="highlightRef"
       :class="{ hidden: appStore.isImmersive }">
  </div>

  <div id="touchpad-container" 
       ref="containerRef" 
       :class="{ 
         minimized: isMinimized, 
         'move-mode': !isCursorLocked,
         'immersive-mode': appStore.isImmersive 
       }">
    
    <div id="status-bar" ref="statusBarRef"></div>

    <div id="touch-area" ref="touchAreaRef">
      <div class="click-wheel">
        <button class="wheel-btn up"    @touchstart="(e) => handleWheelStart(e, 'up')">∧</button>
        <button class="wheel-btn left"  @touchstart="(e) => handleWheelStart(e, 'left')">＜</button>
        <div class="wheel-center"></div>
        <button class="wheel-btn right" @touchstart="(e) => handleWheelStart(e, 'right')">＞</button>
        <button class="wheel-btn down"  @touchstart="(e) => handleWheelStart(e, 'down')">∨</button>
      </div>
    </div>

    <div class="capsule-row">
      <button class="ctrl-btn" 
              ref="btnBackRef"
              :class="{ disabled: appStore.isImmersive }"
              @touchstart.stop="onBtnBack">
        ↩
      </button>

      <button class="ctrl-btn" 
              ref="btnConfirmRef"
              id="btn-confirm"
              @touchstart.stop="onBtnConfirm">
        {{ appStore.isImmersive ? '⏯' : '✔' }}
      </button>

      <button class="ctrl-btn" 
              ref="btnModeRef"
              @touchstart="(e) => handleSmartBtnStart(e, 'mode')"
              @touchmove="handleSmartBtnMove"
              @touchend="(e) => handleSmartBtnEnd(e, 'mode')">
        {{ isMinimized ? '◎' : (appStore.isImmersive ? '❐' : '⚙') }}
      </button>

      <button class="ctrl-btn" 
              ref="btnSlotBRef"
              @touchstart="(e) => handleSmartBtnStart(e, 'slotB')"
              @touchmove="handleSmartBtnMove"
              @touchend="(e) => handleSmartBtnEnd(e, 'slotB')">
        ≡
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

// --- Refs ---
const cursorRef = ref(null);
const containerRef = ref(null);
const touchAreaRef = ref(null);
const statusBarRef = ref(null);
const highlightRef = ref(null);
const btnConfirmRef = ref(null);
const btnBackRef = ref(null);

// --- 核心状态 ---
// 初始位置设定 (避免依赖 window.innerHeight 导致初始化飞出屏幕)
let cursorX = 200;
let cursorY = 200;
let panelX = 20;
let panelY = 300; 

// 交互状态
const isMinimized = ref(false);
const isCursorLocked = ref(true); 
let lockedTargetElement = null;   
let animationFrameId = null;

// 手势系统
let startX = 0;
let startY = 0;
let isDraggingPanel = false; 
let hasMoved = false; // ✨ 新增：标记是否发生了移动，用于区分点击和拖拽
let lastFrameTime = 0;
let cachedScrollContainer = null;

// ✨ 新增：Hover 检测相关的状态变量
let prevCursorX = 0;
let prevCursorY = 0;
let hoverCheckFrame = 0; // 用于降频计数

// 智能按钮状态机
let smartBtnState = {        
  activeId: null,
  startX: 0,
  startY: 0,
  isSlide: false
};
const SLIDE_THRESHOLD = 20;   

// --- 新增状态变量 ---
let activeWheelBtn = null; // 记录当前按下的方向键元素
let activeWheelDir = null; // 记录当前按下的方向

const EDGE_THRESHOLD = 100;   
const MAX_SCROLL_SPEED = 12;  

// =================================================================
// 🧠 1. 智能按钮逻辑
// =================================================================
const handleSmartBtnStart = (e, id) => {
  e.stopPropagation(); 
  smartBtnState.activeId = id;
  smartBtnState.startX = e.touches[0].clientX;
  smartBtnState.startY = e.touches[0].clientY;
  smartBtnState.isSlide = false;
  e.currentTarget.style.transform = 'scale(0.9)';

  // 🔥🔥🔥 新增：预热逻辑 🔥🔥🔥
  if (id === 'slotB') {
    appStore.preloadExtraPanelData('comments');
  }
};

const handleSmartBtnMove = (e) => {
  // 阻止冒泡，防止触发面板拖拽
  e.stopPropagation(); 
  
  if (!smartBtnState.activeId) return;
  const dx = e.touches[0].clientX - smartBtnState.startX;
  const dy = e.touches[0].clientY - smartBtnState.startY;
  
  // 如果移动超过阈值，标记为滑动
  if (Math.hypot(dx, dy) > SLIDE_THRESHOLD) {
    smartBtnState.isSlide = true;
  }
};

const handleSmartBtnEnd = (e, id) => {
  e.stopPropagation(); 

  if (smartBtnState.activeId !== id) return;
  e.currentTarget.style.transform = 'scale(1)'; 
  
  if (smartBtnState.isSlide) {
    // >>> 滑动逻辑
    if (id === 'mode') {
      toggleMinimize();
      if (navigator.vibrate) navigator.vibrate(30);
    } else if (id === 'slotB') {
      // 🔄 改为 Toggle：再次滑动关闭详情
      appStore.toggleExtraPanel('details'); 
      if (navigator.vibrate) navigator.vibrate(30);
    }
  } else {
    // >>> 单点逻辑
    if (id === 'mode') {
      appStore.toggleImmersive();
    } else if (id === 'slotB') {
      // 🔄 改为 Toggle：再次点击关闭评论
      appStore.toggleExtraPanel('comments');
    }
  }
  
  smartBtnState.activeId = null;
  smartBtnState.isSlide = false;
};

// =================================================================
// 🎮 2. 常规按钮与方向盘
// =================================================================
const onBtnBack = (e) => {
  e.preventDefault();
  if (appStore.isImmersive) return; 
  if (btnBackRef.value) {
    btnBackRef.value.style.transform = 'scale(0.8)';
    setTimeout(() => btnBackRef.value && (btnBackRef.value.style.transform = 'scale(1)'), 150);
  }
  lockedTargetElement = null; 
  appStore.goBack();          
  if (navigator.vibrate) navigator.vibrate(20);
};

const onBtnConfirm = (e) => {
  e.preventDefault();
  if (btnConfirmRef.value) {
    btnConfirmRef.value.style.transform = 'scale(0.8)';
    setTimeout(() => btnConfirmRef.value && (btnConfirmRef.value.style.transform = 'scale(1)'), 150);
  }

  if (appStore.isImmersive) {
    appStore.sendVideoCommand('togglePlay');
  } else {
    if (lockedTargetElement) {
      lockedTargetElement.click();
    } else {
      const el = document.elementFromPoint(cursorX, cursorY);
      if (el) el.click();
    }
    if (cursorRef.value) {
      cursorRef.value.style.transform = `translate3d(${cursorX - 10}px, ${cursorY - 10}px, 0) scale(0.5)`;
      setTimeout(() => cursorRef.value && (cursorRef.value.style.transform = `translate3d(${cursorX - 10}px, ${cursorY - 10}px, 0) scale(1)`), 100);
    }
  }
  if (navigator.vibrate) navigator.vibrate(20);
};

const handleWheelStart = (e, dir) => {
  // 不阻止冒泡，让 Container 也能收到 start 事件来计算坐标
  // e.stopPropagation(); <--- 删除这行
  
  const btn = e.target.closest('.wheel-btn');
  if (btn) {
    activeWheelBtn = btn;
    activeWheelDir = dir;
    activeWheelBtn.classList.add('pressed'); // 添加按压样式
  }
};

// =================================================================
// 🕹️ 3. 物理引擎与 DOM 交互
// =================================================================
const jumpTo = (direction) => {
  if (!direction) return;
  let startRect;
  if (lockedTargetElement) {
    startRect = lockedTargetElement.getBoundingClientRect();
  } else {
    startRect = { left: cursorX, top: cursorY, width: 0, height: 0, right: cursorX, bottom: cursorY };
  }

  const cx1 = startRect.left + startRect.width / 2;
  const cy1 = startRect.top + startRect.height / 2;
  const allBoxes = Array.from(document.querySelectorAll('.target-box'));
  let bestCandidate = null;
  let minDistance = Infinity;

  allBoxes.forEach(box => {
    if (box === lockedTargetElement) return;
    const rect = box.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const cx2 = rect.left + rect.width / 2;
    const cy2 = rect.top + rect.height / 2;
    const dx = cx2 - cx1;
    const dy = cy2 - cy1;

    let isValid = false;
    const threshold = Math.max(rect.width, rect.height) * 0.8; 

    if (direction === 'right') isValid = dx > 0 && Math.abs(dy) < Math.abs(dx) + threshold;
    else if (direction === 'left') isValid = dx < 0 && Math.abs(dy) < Math.abs(dx) + threshold;
    else if (direction === 'down') isValid = dy > 0 && Math.abs(dx) < Math.abs(dy) + threshold;
    else if (direction === 'up') isValid = dy < 0 && Math.abs(dx) < Math.abs(dy) + threshold;

    if (isValid) {
      const PENALTY = 4;
      let weightedDist;
      if (direction === 'left' || direction === 'right') {
         weightedDist = Math.sqrt(dx*dx + Math.pow(dy * PENALTY, 2));
      } else {
         weightedDist = Math.sqrt(Math.pow(dx * PENALTY, 2) + dy*dy);
      }
      if (weightedDist < minDistance) {
        minDistance = weightedDist;
        bestCandidate = box;
      }
    }
  });

  if (bestCandidate) {
    lockedTargetElement = bestCandidate;
    const container = bestCandidate.closest('.card-inner') || bestCandidate.closest('.scroll-container');
    if (container) cachedScrollContainer = container;
    bestCandidate.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

const handleEdgeScroll = () => {
  if (!isCursorLocked.value || isMinimized.value || lockedTargetElement) return false;
  const screenH = window.innerHeight;
  let speed = 0;

  if (cursorY > screenH - EDGE_THRESHOLD) {
    const ratio = (cursorY - (screenH - EDGE_THRESHOLD)) / EDGE_THRESHOLD;
    speed = ratio * MAX_SCROLL_SPEED;
  } else if (cursorY < EDGE_THRESHOLD) {
    const ratio = (EDGE_THRESHOLD - cursorY) / EDGE_THRESHOLD;
    speed = -ratio * MAX_SCROLL_SPEED;
  }

  if (Math.abs(speed) < 0.5) return false;

  let container = cachedScrollContainer;
  if (!container || !container.isConnected) {
    const centerEl = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    if (centerEl) {
      container = centerEl.closest('.card-inner') || centerEl.closest('[style*="overflow"]');
      if (container) cachedScrollContainer = container;
    }
  }

  if (container) {
    container.scrollTop += speed;
    return true; 
  }
  return false;
};

// 🔍 核心功能恢复：光标下的元素高亮检测
const checkHover = () => {
  // 沉浸模式下不检测
  if (appStore.isImmersive) return;

  const el = document.elementFromPoint(cursorX, cursorY);
  if (!el) return;

  // 顺便更新滚动容器缓存 (辅助边缘滚动)
  const scrollContainer = el.closest('.card-inner') || el.closest('.scroll-container');
  if (scrollContainer) cachedScrollContainer = scrollContainer;

  // 检测是否是目标元素 (必须包含 class="target-box")
  const target = el.closest('.target-box');
  
  if (target) {
    const rect = target.getBoundingClientRect();
    if (highlightRef.value) {
      highlightRef.value.style.width = `${rect.width}px`;
      highlightRef.value.style.height = `${rect.height}px`;
      highlightRef.value.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
      highlightRef.value.style.opacity = '1';
    }
  } else {
    // 如果不是目标元素，隐藏高亮框
    if (highlightRef.value) highlightRef.value.style.opacity = '0';
  }
};

// 渲染循环 (修改后：加入了 Hover 检测与节流)
const updateLoop = (timestamp) => {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const dt = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;
  const safeDt = Math.min(dt, 0.1);

  // 1. 更新面板位置
  if (containerRef.value) {
    containerRef.value.style.left = `${panelX}px`;
    containerRef.value.style.top = `${panelY}px`;
  }

  // 2. 更新光标物理 (仅非沉浸模式)
  if (!appStore.isImmersive && cursorRef.value) {
    if (lockedTargetElement) {
      // --- A. 吸附模式 ---
      const rect = lockedTargetElement.getBoundingClientRect();
      const targetX = rect.left + rect.width / 2;
      const targetY = rect.top + rect.height / 2;
      
      const smooth = 1 - Math.exp(-15 * safeDt); 
      cursorX += (targetX - cursorX) * smooth;
      cursorY += (targetY - cursorY) * smooth;

      // 吸附时，强制高亮框跟随目标
      if (highlightRef.value) {
        highlightRef.value.style.width = `${rect.width}px`;
        highlightRef.value.style.height = `${rect.height}px`;
        highlightRef.value.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
        highlightRef.value.style.opacity = '1';
      }
    } else {
      // --- B. 自由移动模式 ---
      
      // ✨ 计算移动距离
      const dist = Math.hypot(cursorX - prevCursorX, cursorY - prevCursorY);
      
      // 只有当光标发生实质性移动 (>0.5px) 时，才执行 Hover 检测
      if (dist > 0.5) {
        hoverCheckFrame++;
        // 🚀 性能优化：每 5 帧检测一次 (约 80ms)，避免每帧调用 elementFromPoint 导致卡顿
        if (hoverCheckFrame % 10 === 0) {
          checkHover();
        }
      }
      
      handleEdgeScroll();
    }
    
    // 更新 DOM
    cursorRef.value.style.transform = `translate3d(${cursorX - 10}px, ${cursorY - 10}px, 0)`;
    
    // 记录上一帧位置，用于计算速度
    prevCursorX = cursorX;
    prevCursorY = cursorY;
  }

  animationFrameId = requestAnimationFrame(updateLoop);
};

// =================================================================
// 🖐️ 4. 全局触摸/拖拽处理 (核心修复部分)
// =================================================================
const handlePanelTouchStart = (e) => {
  // 🔴 修改：仅忽略功能键 (ctrl-btn)，允许方向键 (wheel-btn) 进入逻辑初始化 startX/Y
  if (e.target.closest('.ctrl-btn')) return;
  
  e.preventDefault(); 
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
  hasMoved = false; 

  // 判定是否拖拽面板
  // 注意：如果是 wheel-btn，这里 isDraggingPanel 会是 false，
  // 这样在 Move 时就会进入 "移动光标" 的 else 分支，符合预期。
  if (e.target === statusBarRef.value || isMinimized.value || appStore.isImmersive || !isCursorLocked.value) {
    isDraggingPanel = true;
  } else {
    isDraggingPanel = false;
  }
};

const handlePanelTouchMove = (e) => {
  // 同样仅忽略功能键
  if (e.target.closest('.ctrl-btn')) return;
  e.preventDefault();
  
  const touch = e.touches[0];
  const deltaX = touch.clientX - startX;
  const deltaY = touch.clientY - startY;

  if (Math.hypot(deltaX, deltaY) > 5) {
    hasMoved = true;
    
    // 🔴 核心修复：如果发生了移动，且当前有激活的方向键 -> 视为误触，取消方向键点击，转为光标拖拽
    if (activeWheelBtn) {
      activeWheelBtn.classList.remove('pressed');
      activeWheelBtn = null;
      activeWheelDir = null;
    }
  }

  if (isDraggingPanel) {
    if (hasMoved) {
      panelX += deltaX;
      panelY += deltaY;
      clampPanelPosition();
    }
  } else {
    // 移动光标 (方向键上的滑动会进入这里)
    if (!appStore.isImmersive) {
      if (hasMoved) lockedTargetElement = null;
      const sensitivity = 2.5; 
      cursorX += deltaX * sensitivity;
      cursorY += deltaY * sensitivity;
      cursorX = Math.max(0, Math.min(window.innerWidth, cursorX));
      cursorY = Math.max(0, Math.min(window.innerHeight, cursorY));
    }
  }

  startX = touch.clientX;
  startY = touch.clientY;
};

// ✨✨✨ 核心修复：添加 TouchEnd 处理点击逻辑 ✨✨✨
const handlePanelTouchEnd = (e) => {
  // 1. 处理最小化点击
  if (isMinimized.value && !hasMoved) {
    toggleMinimize();
    e.preventDefault();
    return;
  }

  // 🔴 2. 处理方向键点击 (只有当 activeWheelBtn 还存在且没有发生 Move 时触发)
  if (activeWheelBtn && !hasMoved) {
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(15);
    
    // 执行方向键逻辑
    if (appStore.isImmersive) {
      switch(activeWheelDir) {
        case 'up': appStore.playPrevVideo(); break;
        case 'down': appStore.playNextVideo(); break;
        case 'left': appStore.sendVideoCommand('seek', -10); break; 
        case 'right': appStore.sendVideoCommand('seek', 10); break;
      }
    } else {
      jumpTo(activeWheelDir);
    }
  }

  // 清理状态
  if (activeWheelBtn) {
    activeWheelBtn.classList.remove('pressed');
    activeWheelBtn = null;
    activeWheelDir = null;
  }
  
  isDraggingPanel = false;
  hasMoved = false;
};

const handleStatusBarClick = () => {
  if (!appStore.isImmersive) {
    isCursorLocked.value = !isCursorLocked.value;
    if (navigator.vibrate) navigator.vibrate(20);
  }
};

const clampPanelPosition = () => {
  const w = isMinimized.value ? 50 : 180;
  const h = isMinimized.value ? 50 : 300;
  panelX = Math.max(0, Math.min(window.innerWidth - w, panelX));
  panelY = Math.max(0, Math.min(window.innerHeight - h, panelY));
};

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value;
  lockedTargetElement = null;
  // 展开时，延迟一帧检查边界，防止因为尺寸变大卡在屏幕外
  if (!isMinimized.value) {
    setTimeout(clampPanelPosition, 50); 
  }
};

// =================================================================
// 🔄 生命周期
// =================================================================
onMounted(() => {
  // 初始化坐标
  if (window.innerWidth > 0) {
    panelX = 20;
    panelY = window.innerHeight - 350;
    if (panelY < 0) panelY = 100;
    cursorX = window.innerWidth / 2;
    cursorY = window.innerHeight / 2;
  }

  // 注册全局事件监听 (核心：补全了 touchend)
  if (containerRef.value) {
    containerRef.value.addEventListener('touchstart', handlePanelTouchStart, { passive: false });
    containerRef.value.addEventListener('touchmove', handlePanelTouchMove, { passive: false });
    containerRef.value.addEventListener('touchend', handlePanelTouchEnd, { passive: false });
  }
  
  if (statusBarRef.value) {
    statusBarRef.value.addEventListener('click', handleStatusBarClick);
  }

  // ⚡️ 核心修复：监听沉浸模式变化，切换时清理残留的高亮框与状态
  watch(() => appStore.isImmersive, (val) => {
    if (val) {
      // >>> 进入沉浸模式 (全屏)
      
      // 1. 强制隐藏高亮框 (清除 inline style 的 opacity: 1)
      if (highlightRef.value) {
        highlightRef.value.style.opacity = '0';
      }
      
      // 2. 隐藏光标
      if (cursorRef.value) {
        cursorRef.value.style.opacity = '0';
      }

      // 3. 冻结/释放吸附目标
      lockedTargetElement = null;
      
      // 4. 防止方向键卡在按下状态
      if (activeWheelBtn) {
        activeWheelBtn.classList.remove('pressed');
        activeWheelBtn = null;
        activeWheelDir = null;
      }
    } else {
      // >>> 退出沉浸模式 (窗口)
      
      // 1. 恢复光标显示
      if (cursorRef.value) {
        cursorRef.value.style.opacity = '1';
      }
      
      // 2. 重置时间戳，防止 RAF 计算出巨大的 dt 导致瞬移
      lastFrameTime = performance.now(); 
      
      // 3. 立即检测一次当前位置，恢复高亮 (如果底下有元素的话)
      requestAnimationFrame(() => {
        checkHover();
      });
    }
  });

  watch(() => appStore.cursorMoveRequest, (req) => {
    if (req && req.targetId) {
      setTimeout(() => {
        const el = document.getElementById(req.targetId);
        if (el) {
          lockedTargetElement = el; 
          const rect = el.getBoundingClientRect();
          cursorX = rect.left + rect.width / 2;
          cursorY = rect.top + rect.height / 2;
        }
      }, 150);
    }
  });

  animationFrameId = requestAnimationFrame(updateLoop);
});

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (containerRef.value) {
    containerRef.value.removeEventListener('touchstart', handlePanelTouchStart);
    containerRef.value.removeEventListener('touchmove', handlePanelTouchMove);
    containerRef.value.removeEventListener('touchend', handlePanelTouchEnd);
  }
});
</script>

<style scoped>
/* 保持原有高层级样式 */
#virtual-cursor {
  position: fixed;
  top: 0; left: 0;
  width: 20px; height: 20px;
  background: rgba(255, 59, 48, 0.9);
  border: 2px solid #fff;
  border-radius: 50%;
  pointer-events: none; 
  z-index: 999999; 
  box-shadow: 0 2px 8px rgba(255, 59, 48, 0.4);
  will-change: transform;
  transition: opacity 0.3s;
  display: block; 
}
#virtual-cursor.hidden { opacity: 0; }

#touchpad-container {
  position: fixed;
  /* 初始位置占位 */
  left: 20px; top: 200px; 
  width: 180px;
  height: auto;
  min-height: 250px; 
  background: rgba(255, 255, 255, 0.75); 
  /* backdrop-filter: blur(15px); */
  /* -webkit-backdrop-filter: blur(15px); */
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  border-radius: 32px;
  z-index: 1000000; 
  display: flex;
  flex-direction: column;
  overflow: hidden;
  touch-action: none;
  
  transition: 
      width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
      height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
      min-height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
      border-radius 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
      background-color 0.3s,
      border-color 0.3s;
      
  will-change: transform, left, top;
}

#touchpad-container.immersive-mode {
  background: rgba(30, 30, 30, 0.7); 
  border-color: rgba(255, 255, 255, 0.1);
}
#touchpad-container.immersive-mode .wheel-btn { color: rgba(255, 255, 255, 0.9); }
#touchpad-container.immersive-mode .ctrl-btn { color: rgba(255, 255, 255, 0.9); background: rgba(255,255,255,0.1); }
#touchpad-container.immersive-mode .wheel-center { background: rgba(255,255,255,0.15); }

#touchpad-container.move-mode { border-color: rgba(255, 149, 0, 0.5); }
#touchpad-container.move-mode #status-bar { background: #FF9500; width: 60px; }

#touchpad-container.minimized {
  width: 50px !important;
  height: 50px !important;
  min-height: 0 !important;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}
/* 最小化后隐藏内部元素 */
#touchpad-container.minimized #touch-area,
#touchpad-container.minimized .capsule-row,
#touchpad-container.minimized #status-bar {
  opacity: 0;
  pointer-events: none;
  transition-duration: 0.1s;
}
/* 最小化后的悬浮球样式 */
#touchpad-container.minimized::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 12px; height: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 10px rgba(255,255,255,0.5);
}

#status-bar {
  height: 6px; 
  width: 50px;
  background: rgba(0,0,0,0.15);
  border-radius: 3px;
  margin: 12px auto 5px auto;
  flex-shrink: 0;
  transition: background 0.3s, transform 0.1s;
}

#touch-area {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  transition: opacity 0.15s;
}

.click-wheel {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f2f2f2; 
  box-shadow: 
      0 4px 10px rgba(0,0,0,0.1),
      inset 0 1px 2px rgba(255,255,255,0.8);
  border: 1px solid rgba(0,0,0,0.05);
  transform: translateZ(0);
}
#touchpad-container.immersive-mode .click-wheel { background: #333; }

.wheel-btn {
  position: absolute;
  width: 45px; 
  height: 40px;
  background: transparent;
  border: none;
  color: #999;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.1s, transform 0.1s;
}
.wheel-btn.pressed { color: #007AFF; transform: scale(0.9); }
.wheel-btn.up { top: 0; left: 50%; transform: translateX(-50%); }
.wheel-btn.down { bottom: 0; left: 50%; transform: translateX(-50%); }
.wheel-btn.left { left: 0; top: 50%; transform: translateY(-50%); }
.wheel-btn.right { right: 0; top: 50%; transform: translateY(-50%); }

.wheel-center {
  position: absolute;
  top: 50%; left: 50%;
  width: 40px; height: 40px;
  transform: translate(-50%, -50%);
  background: #ffffff;
  border-radius: 50%;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
  pointer-events: none;
}

.capsule-row {
  flex-shrink: 0;
  height: 40px;
  margin: 0 15px 20px 15px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  transition: opacity 0.15s;
}
#touchpad-container.immersive-mode .capsule-row { background: rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.1); }

.ctrl-btn {
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  border-radius: 40px;
  color: #555;
  font-size: 16px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ctrl-btn:active { background: rgba(255,255,255,0.8); }
.ctrl-btn.disabled { opacity: 0.3; pointer-events: none; }
#btn-confirm { color: #007AFF; font-weight: bold; }

#highlight-box {
  position: fixed; top: 0; left: 0;
  z-index: 999990; 
  pointer-events: none; 
  background-color: rgba(0, 0, 0, 0.08); 
  border-radius: 12px; 
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  opacity: 0;
  will-change: transform, width, height, opacity;
}
#highlight-box.hidden { opacity: 0; }
</style>