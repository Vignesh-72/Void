import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Include both logos: logotrans.png (for UI) and logo.jpeg (for App Icon)
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.jpeg', 'logotrans.png'],
      manifest: {
        name: 'VOID Protocol',
        short_name: 'VOID',
        description: 'Advanced Space Telemetry Dashboard',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        // Mobile Home Screen Icons (Using the solid JPEG)
        icons: [
          {
            src: 'logo.jpeg', // Must match the file in your /public folder
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'logo.jpeg', 
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
})