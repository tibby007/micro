import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'window.API_CONFIG': {
      GOOGLE_MAPS_API_KEY: JSON.stringify(process.env.VITE_GOOGLE_MAPS_API_KEY || '')
    }
  }
})