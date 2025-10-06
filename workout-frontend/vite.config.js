import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev/build config.
export default defineConfig({ 
    plugins: [react()] 
})
