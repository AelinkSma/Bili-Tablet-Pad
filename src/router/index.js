import { createRouter, createWebHistory, RouterView } from 'vue-router'
import { h } from 'vue'

// --- 组件引入 ---
import SidebarNav from '@/组件/A_布局/slot_A一级导航.vue'
import CategoryBoard from '@/组件/E_分类/cz分类板.vue'
import CategoryList from '@/组件/E_分类/cz分类列表.vue'
import SearchSidebar from '@/组件/G_搜索/搜索侧边栏.vue'
import SearchGrid from '@/组件/G_搜索/搜索结果.vue'
import UserDashboard from '@/组件/D_用户/cz用户仪表板.vue'
import SettingsList from '@/组件/G_设置/cz设置列表.vue'

// Slot C (主内容)
import WelcomePage from '@/组件/A_布局/slot_C三级导航.vue'
import AppearanceSettings from '@/组件/G_设置/设置中心/B_外观显示/cz外观设置.vue'
import PlaySettings from '@/组件/G_设置/设置中心/D_播放设置/cz播放设置.vue'
import StartupSettings from '@/组件/G_设置/设置中心/A_启动设置/cz启动设置.vue'
import ListSettings from '@/组件/G_设置/设置中心/C_列表设置/cz列表长度设置.vue'
import AboutSidebar from '@/组件/Z_关于/cz关于侧边栏.vue'
import AboutDetail from '@/组件/Z_关于/cz关于详情.vue'

// 列表组件直接引入
import HotVideoList from '@/组件/B_slot_B列表/A_热门视频列表.vue'

// ❌ 删除或注释掉这个中间组件，我们不再需要它
// const EmptyRouterView = { 
//   name: 'SettingsLayout',
//   render: () => h(RouterView) 
// }

const routes = [
  {
    path: '/',
    redirect: '/home',
    component: () => import('@/views/HomeView.vue'),
    children: [
      {
        path: 'home',
        name: 'home',
        components: {
          sidebar: SidebarNav,
          'secondary-sidebar': HotVideoList, 
          default: WelcomePage
        }
      },
      // ... (其他路由保持不变)
      {
        path: 'category',
        name: 'category',
        components: {
          sidebar: SidebarNav,
          'secondary-sidebar': CategoryBoard,
          default: WelcomePage
        }
      },
      {
        path: 'category/:rid',
        name: 'category-list',
        props: { 'secondary-sidebar': (route) => ({ rid: route.params.rid, title: route.query.title }) },
        components: {
          sidebar: SidebarNav,
          'secondary-sidebar': CategoryList,
          default: WelcomePage
        }
      },
      {
        path: 'search',
        name: 'search',
        components: {
          sidebar: SidebarNav,
          'secondary-sidebar': SearchSidebar,
          default: SearchGrid
        }
      },
      {
        path: 'mine',
        name: 'mine',
        components: {
          sidebar: SidebarNav,
          'secondary-sidebar': UserDashboard,
          default: WelcomePage
        }
      },
      
      // ✅ 修复后的设置路由 (复用旧逻辑)
      {
        path: 'settings',
        // 父级不再定义 components，只负责重定向
        redirect: '/settings/startup', 
        children: [
          { 
            path: 'startup', 
            name: 'settings-startup', 
            // 恢复扁平化配置：明确指定 Slot A, B, C
            components: {
              sidebar: SidebarNav,
              'secondary-sidebar': SettingsList, // Slot B
              default: StartupSettings           // Slot C
            }
          },
          { 
            path: 'appearance', 
            name: 'settings-appearance', 
            components: {
              sidebar: SidebarNav,
              'secondary-sidebar': SettingsList,
              default: AppearanceSettings
            }
          },
          { 
            path: 'play', 
            name: 'settings-play', 
            components: {
              sidebar: SidebarNav,
              'secondary-sidebar': SettingsList,
              default: PlaySettings
            }
          },
          { 
            path: 'videocount', 
            name: 'settings-videocount', 
            components: {
              sidebar: SidebarNav,
              'secondary-sidebar': SettingsList,
              default: ListSettings
            }
          },
        ]
      },
      
      {
        path: 'about',
        redirect: '/about/disclaimer',
        children: [
          {
            path: 'disclaimer',
            name: 'about-disclaimer',
            components: {
              sidebar: SidebarNav,
              'secondary-sidebar': AboutSidebar,
              default: AboutDetail
            }
          },
          {
            path: 'tech',
            name: 'about-tech',
            components: {
              sidebar: SidebarNav,
              'secondary-sidebar': AboutSidebar,
              default: AboutDetail
            }
          },
          {
            path: 'motivation',
            name: 'about-motivation',
            components: {
              sidebar: SidebarNav,
              'secondary-sidebar': AboutSidebar,
              default: AboutDetail
            }
          },
          {
            path: 'features',
            name: 'about-features',
            components: {
              sidebar: SidebarNav,
              'secondary-sidebar': AboutSidebar,
              default: AboutDetail
            }
          },
          {
            path: 'future',
            name: 'about-future',
            components: {
              sidebar: SidebarNav,
              'secondary-sidebar': AboutSidebar,
              default: AboutDetail
            }
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫保持不变...
router.beforeEach(async (to, from, next) => {
  const { useAppStore } = await import('@/stores/app')
  const store = useAppStore()
  
  if (to.path.startsWith('/settings')) {
    store.currentTab = 'settings'
  } else if (to.path.startsWith('/about')) {
    store.currentTab = 'about'
  } else if (to.path.startsWith('/category')) {
    store.currentTab = 'category'
  } else {
    store.currentTab = to.name
  }

  if (to.path.startsWith('/settings') || to.path.startsWith('/about')) {
    store.closeVideo()
    store.closeExtraPanel()
  }

  next()
})

export default router