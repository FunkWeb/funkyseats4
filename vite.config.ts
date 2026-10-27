import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const { PORT = '3000' } = loadEnv(mode, process.cwd(), 'PORT')

  return {
    root: 'frontend',
    build: { outDir: '../dist/frontend', emptyOutDir: true },
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: `http://localhost:${PORT}`,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
