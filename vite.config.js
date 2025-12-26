import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 与 request.js 保持一致
const GOLDEN_COOKIE = 'buvid3=9909249E-9043-3971-5918-62021578508493infoc; b_nut=1697773200;'
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.bilibili.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        headers: {
          Referer: 'https://www.bilibili.com/',
          'User-Agent': UA,//'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': GOLDEN_COOKIE,//'buvid3=87F63990-0720-3320-9B02-83020923193425267infoc;' 
        }
      },

      '/dm': {
        target: 'https://comment.bilibili.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dm/, ''),
        headers: {
          'Referer': 'https://www.bilibili.com/',
          'User-Agent': UA,//'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': GOLDEN_COOKIE,//'buvid3=87F63990-0720-3320-9B02-83020923193425267infoc;' 
       }
      },

      '/bfs': {
        target: 'https://i0.hdslb.com/bfs', // 转发到 B 站图片 CDN
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bfs/, ''), // 去掉 /bfs 前缀后转发
        headers: {
          Referer: 'https://www.bilibili.com/', // 伪造防盗链
          'User-Agent': 'Mozilla/5.0'
        }
      }

    }
  }
})
