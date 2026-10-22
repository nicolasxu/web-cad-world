import { templateCompilerOptions } from '@tresjs/core'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      // Allow TresJS's custom renderer to treat `Tres*` tags as
      // Three.js components without unknown-element warnings.
      ...templateCompilerOptions,
    }),
  ],
  optimizeDeps: {
    exclude: ['three'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            return id.includes('three') || id.includes('@tresjs') ? 'three' : 'vendor'
          }
        },
      },
    },
  },
})
