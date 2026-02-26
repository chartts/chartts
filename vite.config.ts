import { defineConfig } from 'vite'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: resolve(__dirname, 'dev'),
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@chartts/core': resolve(__dirname, 'packages/core/src/index.ts'),
    },
  },
  server: {
    port: 4300,
    open: true,
  },
})
