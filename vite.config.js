import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // <-- 1. Mantenemos tu plugin original (swc)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // --- 2. AÑADIMOS LA SECCIÓN DEL PROXY ---
  server: {
    proxy: {
      // "Cuando veas una petición que empieza con /api..."
      '/api': {
        // "...redirígela a esta dirección (nuestro backend local)"
        target: 'http://localhost:5000',
        
        // Esto es necesario para que el backend acepte la petición
        changeOrigin: true, 
      }
    }
  }
  // --- FIN DE LA SECCIÓN ---
})