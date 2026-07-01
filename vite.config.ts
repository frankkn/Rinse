import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// base '/' — deployed at a root domain on Vercel (rinse.vercel.app).
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})
