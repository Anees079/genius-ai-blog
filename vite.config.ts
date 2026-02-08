import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')  // Only loads VITE_ vars

  return {
    plugins: [react()],

    // ✅ GitHub Pages base MUST match your repo name with trailing slash
    base: '/genius-ai-blog/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    // Define environment vars safely for frontend
    define: {
      __APP_ENV__: JSON.stringify(mode),
    },
  }
})
