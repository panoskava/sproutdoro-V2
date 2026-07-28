export interface PWANotificationActionHandlers {
  onPause: () => void
  onResume: () => void
  onBreak: () => void
  onSkip: () => void
}

let actionHandlers: PWANotificationActionHandlers | null = null
let lastState: string | null = null
let lastMode: string | null = null
let lastIntention: string | undefined = undefined

export function initPWANotifications(handlers: PWANotificationActionHandlers): void {
  actionHandlers = handlers

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data as { type?: string; action?: string } | undefined
      if (!data || data.type !== 'PWA_NOTIFICATION_ACTION' || !actionHandlers) return

      switch (data.action) {
        case 'pause':
          actionHandlers.onPause()
          break
        case 'resume':
          actionHandlers.onResume()
          break
        case 'break':
          actionHandlers.onBreak()
          break
        case 'skip':
          actionHandlers.onSkip()
          break
      }
    })
  }
}

export function requestPWANotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }
}

export function updatePWANotification(
  state: 'idle' | 'running' | 'paused' | 'onBreak' | 'complete',
  mode: 'work' | 'shortBreak' | 'longBreak',
  formattedTime: string,
  intention?: string
): void {
  if (!('serviceWorker' in navigator)) return
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  // Prevent reloading notification every second tick.
  // Only update notification card when state, mode, or intention changes!
  if (state === lastState && mode === lastMode && intention === lastIntention) {
    return
  }

  lastState = state
  lastMode = mode
  lastIntention = intention

  navigator.serviceWorker.ready
    .then((reg) => {
      if (state === 'idle' || state === 'complete') {
        reg.active?.postMessage({ type: 'CLOSE_TIMER_NOTIFICATION' })
      } else {
        reg.active?.postMessage({
          type: 'UPDATE_TIMER_NOTIFICATION',
          state,
          mode,
          formattedTime,
          intention,
        })
      }
    })
    .catch(() => {})
}

export function closePWANotification(): void {
  lastState = null
  lastMode = null
  lastIntention = undefined

  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready
    .then((reg) => {
      reg.active?.postMessage({ type: 'CLOSE_TIMER_NOTIFICATION' })
    })
    .catch(() => {})
}
