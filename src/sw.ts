/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()

// Precache all static assets manifest
precacheAndRoute(self.__WB_MANIFEST || [])

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

const NOTIFICATION_TAG = 'sproutdoro-live-timer'

export interface TimerNotificationData {
  type: 'UPDATE_TIMER_NOTIFICATION' | 'CLOSE_TIMER_NOTIFICATION'
  state: 'idle' | 'running' | 'paused' | 'onBreak' | 'complete'
  mode: 'work' | 'shortBreak' | 'longBreak'
  formattedTime: string
  intention?: string
}

// Handle messages from client timer loop
self.addEventListener('message', (event) => {
  const data = event.data as TimerNotificationData | undefined
  if (!data || typeof data !== 'object') return

  if (data.type === 'CLOSE_TIMER_NOTIFICATION' || data.state === 'idle' || data.state === 'complete') {
    event.waitUntil(
      self.registration.getNotifications({ tag: NOTIFICATION_TAG }).then((notifications) => {
        for (const n of notifications) {
          n.close()
        }
      })
    )
    return
  }

  if (data.type === 'UPDATE_TIMER_NOTIFICATION') {
    const modeLabel =
      data.mode === 'work' ? 'Focus Session' : data.mode === 'shortBreak' ? 'Short Break' : 'Long Break'

    const title = data.intention ? `${modeLabel}: ${data.intention}` : modeLabel
    const body = `Time remaining: ${data.formattedTime}`

    interface SWNotificationAction {
      action: string
      title: string
      icon?: string
    }

    let actions: SWNotificationAction[] = []
    if (data.state === 'running') {
      actions = [
        { action: 'pause', title: '⏸️ Pause' },
        { action: 'break', title: '☕ Take Break' },
      ]
    } else if (data.state === 'paused') {
      actions = [
        { action: 'resume', title: '▶️ Resume' },
        { action: 'skip', title: '⏭️ Skip' },
      ]
    } else if (data.state === 'onBreak') {
      actions = [
        { action: 'resume', title: '▶️ Resume Work' },
        { action: 'skip', title: '⏭️ Skip' },
      ]
    }

    const options: NotificationOptions & { renotify?: boolean; silent?: boolean; actions?: SWNotificationAction[] } = {
      body,
      tag: NOTIFICATION_TAG,
      renotify: false,
      silent: true,
      icon: 'icons/icon-192x192.png',
      badge: 'icons/icon-192x192.png',
      data: { url: './index.html' },
      actions,
    }

    event.waitUntil(self.registration.showNotification(title, options as NotificationOptions))
  }
})

// Handle notification action clicks (Pause, Resume, Break, Skip)
self.addEventListener('notificationclick', (event) => {
  const action = event.action
  const notification = event.notification

  // Keep notification open if clicking actions, or close if body clicked
  if (!action) {
    notification.close()
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          if (action) {
            client.postMessage({ type: 'PWA_NOTIFICATION_ACTION', action })
          }
          return
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./index.html')
      }
    })
  )
})
