import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        settings: './settings.html',
        insights: './insights.html',
        garden: './garden.html',
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sproutdoro - Focus Timer',
        short_name: 'Sproutdoro',
        description: 'A garden-themed Pomodoro timer that grows with your focus',
        theme_color: '#516233',
        background_color: '#fdf9ef',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
