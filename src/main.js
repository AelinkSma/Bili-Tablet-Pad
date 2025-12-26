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

app.mount('#app')
