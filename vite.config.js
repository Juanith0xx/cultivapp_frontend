import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-back-icon.svg'],
      manifest: {
        name: 'Cultivapp SaaS',
        short_name: 'Cultivapp',
        description: 'Plataforma de gestión de mercaderistas y puntos de venta',
        theme_color: '#87be00',
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
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // ✅ SOLUCIÓN: Subimos el límite a 5MB para que acepte tu archivo de 3.14MB
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, 
        
        navigateFallbackDenylist: [/^\/api/], 
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkOnly',
          }
        ]
      }
    })
  ],
})