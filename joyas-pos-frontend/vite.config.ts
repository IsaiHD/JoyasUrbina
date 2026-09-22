import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // O el framework que estés usando
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), // O vue(), etc.
    tailwindcss(),
  ],
})