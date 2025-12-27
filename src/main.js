import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' // 引入持久化
// import ElementPlus from 'element-plus'
// import 'element-plus/dist/index.css'
const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// app.use(ElementPlus)
app.use(pinia)
app.use(router)

// 关键代码：仅在开发环境下异步加载 Eruda

  import('eruda').then((eruda) => {
    eruda.default.init({
      // 可选：配置面板顺序或默认隐藏
      tool: ['console', 'elements', 'network', 'resource', 'info'],
      defaults: {
        displaySize: 50, // 面板高度百分比
        transparency: 0.9,
        theme: 'Dark'
      }
    });
    console.log('Eruda 已就绪');
  });

app.mount('#app')
