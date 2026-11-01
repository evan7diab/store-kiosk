import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  // Project site: https://evan7diab.github.io/store-kiosk/
  // Local dev and a normal `npm run build` stay at /.
  base: command === 'build' && process.env.GITHUB_PAGES === 'true' ? '/store-kiosk/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
}))
