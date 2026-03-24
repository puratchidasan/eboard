import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Replace 'electricity-dashboard' with the EXACT name of your GitHub repo 
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/eboard/',
})
