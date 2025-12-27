import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Se actualiza sola cuando haces push a Vercel
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'vite.svg'],
      manifest: {
        name: 'Cherry Market',
        short_name: 'Cherry',
        description: 'Gestión de Cherry Market',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // ESTO elimina la barra del navegador
        orientation: 'portrait', // Bloquea la rotación (opcional, pero recomendado para apps de gestión)
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Importante para que el icono se vea bien en Android
          }
        ]
      }
    })
  ],
  
  // Mantenemos tu configuración de proxy intacta
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true, 
      }
    }
  }
})