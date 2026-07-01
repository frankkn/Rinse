import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// base: '/' in dev for a clean local URL, '/Rinse/' in build for GitHub Pages.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Rinse/' : '/',
  plugins: [react(), tailwindcss()],
}))
