import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'pocketbase/pb_public',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
})