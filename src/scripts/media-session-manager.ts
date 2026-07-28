/**
 * Media Session & Notification Manager
 *
 * Implements OS Live Notifications (Lock Screen, Notification Center, Status Bar)
 * using a 10-second silent WAV Blob attached to a DOM HTMLAudioElement,
 * combined with navigator.mediaSession metadata & setPositionState.
 *
 * Mobile & Desktop browsers require:
 * 1. An HTMLAudioElement actively playing a valid audio track >= 5 seconds.
 * 2. User-gesture initialization (.play() triggered from click event).
 * 3. navigator.mediaSession.setPositionState({ duration, playbackRate, position }).
 */

export interface MediaSessionHandlers {
  onPlay: () => void
  onPause: () => void
  onSkip: () => void
  onBreak: () => void
}

let silentAudio: HTMLAudioElement | null = null
let isPlaying = false

/**
 * Generate a 10-second silent 16-bit 44.1kHz PCM WAV file as a Blob.
 * 10 seconds guarantees browsers recognize a valid duration > 5 seconds.
 */
function createSilentWavBlob(): Blob {
  const sampleRate = 44100
  const seconds = 10
  const numSamples = sampleRate * seconds
  const dataSize = numSamples * 2
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  // RIFF header
  view.setUint32(0, 0x52494646, false) // "RIFF"
  view.setUint32(4, 36 + dataSize, true)
  view.setUint32(8, 0x57415645, false) // "WAVE"

  // fmt subchunk
  view.setUint32(12, 0x666d7420, false) // "fmt "
  view.setUint32(16, 16, true) // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true) // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true) // NumChannels (1)
  view.setUint32(24, sampleRate, true) // SampleRate
  view.setUint32(28, sampleRate * 2, true) // ByteRate
  view.setUint16(32, 2, true) // BlockAlign
  view.setUint16(34, 16, true) // BitsPerSample

  // data subchunk
  view.setUint32(36, 0x64617461, false) // "data"
  view.setUint32(40, dataSize, true)

  return new Blob([buffer], { type: 'audio/wav' })
}

/**
 * Initialize or get the DOM HTMLAudioElement.
 */
export function getOrCreateSilentAudio(): HTMLAudioElement {
  if (silentAudio) return silentAudio

  silentAudio = document.createElement('audio')
  silentAudio.id = 'sproutdoro-media-session-audio'
  silentAudio.loop = true
  silentAudio.volume = 0.01 // Minimal non-zero volume required for iOS/Android

  const blob = createSilentWavBlob()
  silentAudio.src = URL.createObjectURL(blob)
  silentAudio.preload = 'auto'

  document.body.appendChild(silentAudio)
  return silentAudio
}

/**
 * Start playing silent audio during user gesture.
 */
export async function startSilentPlayback(): Promise<void> {
  const audio = getOrCreateSilentAudio()

  try {
    if (audio.paused) {
      const p = audio.play()
      if (p) await p
    }
    isPlaying = true
  } catch (err) {
    console.warn('[MediaSession] Silent audio playback blocked:', err)
  }
}

/**
 * Pause silent audio.
 */
export function pauseSilentPlayback(): void {
  if (!silentAudio || !isPlaying) return
  silentAudio.pause()
  isPlaying = false
}

/**
 * Stop silent audio entirely.
 */
export function stopSilentPlayback(): void {
  if (!silentAudio) return
  silentAudio.pause()
  try {
    silentAudio.currentTime = 0
  } catch {
    // ignore
  }
  isPlaying = false
}

/**
 * Setup Media Session Action Handlers and request Web Notification permission.
 */
export function setupMediaSession(handlers: MediaSessionHandlers): void {
  // Request Web Notifications permission if supported
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }

  if (!('mediaSession' in navigator)) return

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
    // Action handler registration unsupported
  }
}

/**
 * Update OS Media Notification metadata & setPositionState on every tick.
 */
export function updateMediaSession(
  state: 'idle' | 'running' | 'paused' | 'onBreak' | 'complete',
  mode: 'work' | 'shortBreak' | 'longBreak',
  formattedTime: string,
  totalSeconds: number,
  remainingSeconds: number,
  intention?: string
): void {
  if (!('mediaSession' in navigator)) return

  if (state === 'running' || state === 'onBreak') {
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
      title: `${title} (${formattedTime})`,
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

    // Set position state so OS displays seekbar & duration
    if ('setPositionState' in navigator.mediaSession && totalSeconds > 0) {
      const position = Math.max(0, Math.min(totalSeconds, totalSeconds - remainingSeconds))
      navigator.mediaSession.setPositionState({
        duration: Math.max(1, totalSeconds),
        playbackRate: 1,
        position: position,
      })
    }
  } catch (err) {
    console.warn('[MediaSession] Failed to update metadata:', err)
  }
}
