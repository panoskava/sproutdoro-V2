export interface MediaSessionControls {
  onPlay: () => void
  onPause: () => void
  onSkip: () => void
  onBreak: () => void
}

export function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {
      // Permission request ignored or blocked
    })
  }
}

export function showSystemNotification(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: `${import.meta.env.BASE_URL}favicon.svg`,
      })
    } catch {
      // Notification creation failed (e.g. mobile restricted)
    }
  }
}

export function setupMediaSession(controls: MediaSessionControls): void {
  if (!('mediaSession' in navigator)) return

  try {
    navigator.mediaSession.setActionHandler('play', controls.onPlay)
    navigator.mediaSession.setActionHandler('pause', controls.onPause)
    navigator.mediaSession.setActionHandler('nexttrack', controls.onSkip)
    navigator.mediaSession.setActionHandler('previoustrack', controls.onBreak)
  } catch {
    // Action handler registration unsupported
  }
}

export function updateMediaSessionState(
  state: 'idle' | 'running' | 'paused' | 'onBreak' | 'complete',
  mode: 'work' | 'shortBreak' | 'longBreak',
  formattedTime: string,
  intention?: string
): void {
  if (!('mediaSession' in navigator)) return

  if (state === 'running' || state === 'onBreak') {
    navigator.mediaSession.playbackState = 'playing'
  } else if (state === 'paused') {
    navigator.mediaSession.playbackState = 'paused'
  } else {
    navigator.mediaSession.playbackState = 'none'
    return
  }

  const modeText = mode === 'work' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'
  const title = intention ? `${modeText}: ${intention}` : modeText

  navigator.mediaSession.metadata = new MediaMetadata({
    title: `${title} (${formattedTime})`,
    artist: 'Sproutdoro',
    album: 'Pomodoro Focus Timer',
    artwork: [
      { src: `${import.meta.env.BASE_URL}icons/icon-192x192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${import.meta.env.BASE_URL}icons/icon-512x512.png`, sizes: '512x512', type: 'image/png' },
    ],
  })
}
