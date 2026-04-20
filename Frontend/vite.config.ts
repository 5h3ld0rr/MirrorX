import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/helakuru': {
          target: 'https://esena-news-api-v3.vercel.app',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/helakuru/, '')
        }
      }
    },

    preview: {
      port: 80
    }
  }
})


