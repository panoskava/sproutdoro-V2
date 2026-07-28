/**
 * Media Session Manager
 *
 * Provides YouTube/Spotify-style OS-level media notifications (lock screen,
 * notification shade, Control Center) by playing a looping silent audio via
 * an HTMLAudioElement.
 *
 * CRITICAL: Browsers ONLY show OS media notifications when a native
 * HTMLAudioElement (or <video>) is actively playing. AudioContext / Web Audio
 * API sources are intentionally ignored. The previous implementation used
 * AudioContext.createBuffer() which is why it never worked.
 *
 * This version uses:
 *   1. A real silent .m4a audio file (public/sounds/silence.m4a)
 *   2. Fallback: an inline base64-encoded minimal silent MP3
 *
 * The looping silent audio keeps the browser "Now Playing" session alive,
 * so the OS displays mediaSession metadata and action handlers even when
 * the user leaves the app or locks the screen.
 */

export interface MediaSessionHandlers {
  onPlay: () => void
  onPause: () => void
  onSkip: () => void
  onBreak: () => void
}

// Minimal valid silent MP3 frame (base64). This is a proper MPEG Audio
// Layer 3 frame that decodes to silence. Used as fallback if the .m4a
// file fails to load.
const SILENT_MP3_BASE64 =
  'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRBHEAAAAAAD/+1DEAAAGAAGn9AAAIgAANP8AAABMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UMQ2g8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=='

let silentAudio: HTMLAudioElement | null = null
let isPlaying = false

/**
 * Create the silent HTMLAudioElement on first use.
 */
function getOrCreateSilentAudio(): HTMLAudioElement {
  if (silentAudio) return silentAudio

  silentAudio = document.createElement('audio')
  silentAudio.loop = true
  // Must be > 0 for iOS/Safari to register as active media playback.
  // 0.01 is effectively inaudible.
  silentAudio.volume = 0.01

  // Try loading the real .m4a file first; fall back to inline base64 MP3
  const m4aUrl = `${import.meta.env.BASE_URL}sounds/silence.m4a`

  // Create two sources for maximum browser compatibility
  const sourceM4a = document.createElement('source')
  sourceM4a.src = m4aUrl
  sourceM4a.type = 'audio/mp4'

  const sourceMp3 = document.createElement('source')
  sourceMp3.src = `data:audio/mpeg;base64,${SILENT_MP3_BASE64}`
  sourceMp3.type = 'audio/mpeg'

  silentAudio.appendChild(sourceM4a)
  silentAudio.appendChild(sourceMp3)

  // Preload so it's ready instantly when the user taps Start
  silentAudio.preload = 'auto'
  silentAudio.load()

  return silentAudio
}

/**
 * Start playing the silent audio to activate OS media controls.
 *
 * MUST be called inside a user gesture handler (click/tap) so the
 * browser's autoplay policy is satisfied.
 */
export async function startSilentPlayback(): Promise<void> {
  if (isPlaying) return

  const audio = getOrCreateSilentAudio()

  try {
    const playPromise = audio.play()
    if (playPromise) await playPromise
    isPlaying = true
  } catch (err) {
    // Autoplay blocked — will retry on next user gesture
    console.warn('[MediaSession] Silent playback blocked:', err)
  }
}

/**
 * Pause silent audio. OS notification stays visible in "paused" state.
 */
export function pauseSilentPlayback(): void {
  if (!silentAudio || !isPlaying) return
  silentAudio.pause()
  isPlaying = false
}

/**
 * Stop silent audio entirely. Dismisses the OS notification.
 */
export function stopSilentPlayback(): void {
  if (!silentAudio) return
  silentAudio.pause()
  silentAudio.currentTime = 0
  isPlaying = false
}

/**
 * Register MediaSession action handlers (play, pause, skip, break).
 * Call once during page init.
 */
export function setupMediaSession(handlers: MediaSessionHandlers): void {
  if (!('mediaSession' in navigator)) return

  // Pre-create the audio element so it's ready for the first user gesture
  getOrCreateSilentAudio()

  try {
    navigator.mediaSession.setActionHandler('play', () => {
      startSilentPlayback()
      handlers.onPlay()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      pauseSilentPlayback()
      handlers.onPause()
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      handlers.onSkip()
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      handlers.onBreak()
    })
  } catch {
    // Handler registration unsupported
  }
}

/**
 * Update the OS media notification metadata each tick.
 *
 * - running/onBreak → start silent audio, playbackState = 'playing'
 * - paused          → pause silent audio, playbackState = 'paused'
 * - idle/complete   → stop silent audio, clear notification
 */
export function updateMediaSession(
  state: 'idle' | 'running' | 'paused' | 'onBreak' | 'complete',
  mode: 'work' | 'shortBreak' | 'longBreak',
  formattedTime: string,
  intention?: string
): void {
  if (!('mediaSession' in navigator)) return

  if (state === 'running' || state === 'onBreak') {
    // Don't call startSilentPlayback here on every tick —
    // it was already started during the user gesture.
    // Just ensure playbackState is correct.
    navigator.mediaSession.playbackState = 'playing'
  } else if (state === 'paused') {
    pauseSilentPlayback()
    navigator.mediaSession.playbackState = 'paused'
  } else {
    stopSilentPlayback()
    navigator.mediaSession.playbackState = 'none'
    return
  }

  const modeLabel =
    mode === 'work'
      ? 'Focus Session'
      : mode === 'shortBreak'
        ? 'Short Break'
        : 'Long Break'

  const title = intention ? `${modeLabel}: ${intention}` : modeLabel

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${title} — ${formattedTime}`,
      artist: 'Sproutdoro',
      album: 'Focus Timer',
      artwork: [
        {
          src: `${import.meta.env.BASE_URL}icons/icon-192x192.png`,
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: `${import.meta.env.BASE_URL}icons/icon-512x512.png`,
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    })
  } catch {
    // MediaMetadata unsupported
  }
}
