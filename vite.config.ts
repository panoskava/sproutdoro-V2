import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig(({ mode }) => {
  const basePath = mode === 'production' ? '/sproutdoro-V2/' : '/'
  return {
    base: basePath,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    build: {
      rollupOptions: {
        input: {
          main: './index.html',
          settings: './settings.html',
          insights: './insights.html',
          garden: './garden.html',
          privacy: './privacy.html',
          terms: './terms.html',
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
              src: 'icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
          shortcuts: [
            {
              name: 'Start Focus',
              short_name: 'Focus',
              url: `${basePath}index.html`,
              icons: [{ src: 'icons/icon-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'My Garden',
              short_name: 'Garden',
              url: `${basePath}garden.html`,
              icons: [{ src: 'icons/icon-192x192.png', sizes: '192x192' }],
            },
          ],
        },
      }),
    ],
  }
})
