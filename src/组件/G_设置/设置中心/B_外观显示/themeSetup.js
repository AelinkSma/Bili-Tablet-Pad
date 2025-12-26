import { watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'

/**
 * 初始化主题系统
 * 监听设置变化并应用 CSS 变量到 html 根元素
 */
export function setupTheme() {
  const settingsStore = useSettingsStore()

  watch(
    () => [settingsStore.themeMode, settingsStore.primaryColor],
    ([mode, color]) => {
      // 1. 设定深色/浅色模式
      document.documentElement.setAttribute('data-theme', mode)

      // 2. ⚡ 性能优化: 直接设置 CSS 变量
      const rootStyle = document.documentElement.style
      rootStyle.setProperty('--primary-color', color)
      
      // 计算并设置 alpha 变体 (0.2 透明度)
      const rgb = hexToRgb(color)
      if (rgb) {
        rootStyle.setProperty('--primary-color-alpha', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`)
      }
    },
    { immediate: true }
  )
}

// 工具：Hex 转 RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}