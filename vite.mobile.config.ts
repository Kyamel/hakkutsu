import { defineConfig } from 'vite'

export default defineConfig({
  root: 'mobile',
  publicDir: false,
  build: {
    outDir: '../dist-capacitor',
    emptyOutDir: true,
  },
})
