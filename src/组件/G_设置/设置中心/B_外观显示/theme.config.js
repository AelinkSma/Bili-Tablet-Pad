// src/组件/G_设置/设置中心/B_外观显示/theme.config.js

// ❌ 错误写法: const THEME_MODES = [...]
// ✅ 正确写法: export const THEME_MODES = [...]

export const THEME_MODES = [
  {
    key: 'light',
    label: '明亮模式',
    desc: '经典白底灰字，清晰自然',
    icon: '☀️'
  },
  {
    key: 'dark',
    label: '深色模式',
    desc: '深邃黑底，护眼且省电',
    icon: '🌙'
  }
]

export const ACCENT_COLORS = [
  { label: '少女粉', value: '#fb7299' },
  { label: '初音绿', value: '#39c5bb' },
  { label: '宝石蓝', value: '#00a1d6' },
  { label: '罗兰紫', value: '#673ab7' },
  { label: '活力橙', value: '#ff9800' },
  { label: '极客黑', value: '#34495e' },
]