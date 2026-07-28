export interface MediaSessionHandlers {
  onPlay: () => void
  onPause: () => void
  onSkip: () => void
  onBreak: () => void
}

let audioCtx: AudioContext | null = null
let silentSource: AudioBufferSourceNode | null = null
let isAudioPlaying = false

function startSilentAudio(): void {
  if (isAudioPlaying) return
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    if (!audioCtx) {
      audioCtx = new AudioContextClass()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }

    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate)
    silentSource = audioCtx.createBufferSource()
    silentSource.buffer = buffer
    silentSource.loop = true
    silentSource.connect(audioCtx.destination)
    silentSource.start()
    isAudioPlaying = true
  } catch {
    // Web Audio may be restricted until user interaction
  }
}

function stopSilentAudio(): void {
  if (!isAudioPlaying) return
  try {
    if (silentSource) {
      silentSource.stop()
      silentSource.disconnect()
      silentSource = null
    }
    if (audioCtx && audioCtx.state === 'running') {
      audioCtx.suspend()
    }
  } catch {
    // Ignore cleanup errors
  }
  isAudioPlaying = false
}

export function setupMediaSession(handlers: MediaSessionHandlers): void {
  if (!('mediaSession' in navigator)) return

  try {
    navigator.mediaSession.setActionHandler('play', () => {
      startSilentAudio()
      handlers.onPlay()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      stopSilentAudio()
      handlers.onPause()
    })
    navigator.mediaSession.setActionHandler('nexttrack', handlers.onSkip)
    navigator.mediaSession.setActionHandler('previoustrack', handlers.onBreak)
  } catch {
    // Action handler registration unsupported
  }
}

export function updateMediaSession(
  state: 'idle' | 'running' | 'paused' | 'onBreak' | 'complete',
  mode: 'work' | 'shortBreak' | 'longBreak',
  formattedTime: string,
  intention?: string
): void {
  if (!('mediaSession' in navigator)) return

  if (state === 'running' || state === 'onBreak') {
    startSilentAudio()
    navigator.mediaSession.playbackState = 'playing'
  } else if (state === 'paused') {
    stopSilentAudio()
    navigator.mediaSession.playbackState = 'paused'
  } else {
    stopSilentAudio()
    navigator.mediaSession.playbackState = 'none'
    return
  }

  const modeText = mode === 'work' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'
  const titleText = intention ? `${modeText}: ${intention}` : modeText

  navigator.mediaSession.metadata = new MediaMetadata({
    title: `${titleText} (${formattedTime})`,
    artist: 'Sproutdoro',
    album: 'Focus Timer',
    artwork: [
      { src: `${import.meta.env.BASE_URL}icons/icon-192x192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${import.meta.env.BASE_URL}icons/icon-512x512.png`, sizes: '512x512', type: 'image/png' },
    ],
  })
}
