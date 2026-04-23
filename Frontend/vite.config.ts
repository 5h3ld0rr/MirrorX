import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/helakuru': {
          target: 'https://esena-news-api-v3.vercel.app',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/helakuru/, '')
        },
        '/api/weather': {
          target: 'https://api.open-meteo.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/weather/, '')
        },
        '/api/google': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        }
      }
    },

    preview: {
      port: 80
    }
  }
})


