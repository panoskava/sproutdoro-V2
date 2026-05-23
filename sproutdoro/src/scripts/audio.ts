type ScheduledAudioNode = AudioBufferSourceNode | OscillatorNode

export class AudioManager {
  private sounds = new Map<string, HTMLAudioElement>()
  private ambientAudio: HTMLAudioElement | null = null
  private audioCtx: AudioContext | null = null
  private globalVolume = 1
  private isMuted = false
  private ambientIntervalId: number | null = null
  private ambientNodes: ScheduledAudioNode[] = []
  private ambientGains: GainNode[] = []

  loadSound(name: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url)
      audio.addEventListener(
        'canplaythrough',
        () => {
          this.sounds.set(name, audio)
          resolve()
        },
        { once: true }
      )
      audio.addEventListener(
        'error',
        () => reject(new Error(`Failed to load sound: ${url}`)),
        { once: true }
      )
      audio.load()
    })
  }

  playSound(name: string, volume?: number): void {
    const audio = this.sounds.get(name)
    if (!audio) return
    const clone = audio.cloneNode() as HTMLAudioElement
    clone.volume = this.isMuted ? 0 : (volume ?? 1) * this.globalVolume
    clone.play().catch((err) => console.error('Failed to play sound:', err))
  }

  playCompletion(): void {
    if (this.sounds.has('completion')) {
      this.playSound('completion')
      return
    }
    // Web Audio API fallback: gentle bell tone, C5 523.25Hz
    this.playBellTone(523.25, 1.5)
  }

  playBreakStart(): void {
    if (this.sounds.has('break')) {
      this.playSound('break')
      return
    }
    // Fallback: two-tone chime
    this.playBellTone(440, 0.5)
    setTimeout(() => this.playBellTone(554.37, 0.5), 200)
  }

  startAmbient(soundName: string): void {
    this.stopAmbient()

    const cached = this.sounds.get(soundName)
    if (cached) {
      this.ambientAudio = cached.cloneNode() as HTMLAudioElement
      this.ambientAudio.loop = true
      this.ambientAudio.volume = this.isMuted ? 0 : 0.3 * this.globalVolume
      this.ambientAudio.play().catch((err) => {
        console.error('Failed to start ambient:', err)
        this.ambientAudio = null
      })
      return
    }

    // Web Audio API synthesized ambient fallback
    this.synthesizeAmbient(soundName)
  }

  stopAmbient(): void {
    if (this.ambientAudio) {
      this.ambientAudio.pause()
      this.ambientAudio.currentTime = 0
      this.ambientAudio = null
    }

    if (this.ambientIntervalId !== null) {
      window.clearInterval(this.ambientIntervalId)
      this.ambientIntervalId = null
    }

    const ctx = this.audioCtx
    if (ctx) {
      for (const node of this.ambientNodes) {
        try {
          node.stop()
        } catch {
          // Node may already be stopped
        }
      }
    }
    this.ambientNodes = []
    this.ambientGains = []
  }

  setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume))
    if (this.ambientAudio) {
      this.ambientAudio.volume = this.isMuted ? 0 : 0.3 * this.globalVolume
    }
    for (const gain of this.ambientGains) {
      gain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.15 * this.globalVolume,
        this.getAudioContext().currentTime
      )
    }
  }

  mute(): void {
    this.isMuted = true
    if (this.ambientAudio) {
      this.ambientAudio.volume = 0
    }
    for (const gain of this.ambientGains) {
      gain.gain.setValueAtTime(0, this.getAudioContext().currentTime)
    }
  }

  unmute(): void {
    this.isMuted = false
    if (this.ambientAudio) {
      this.ambientAudio.volume = 0.3 * this.globalVolume
    }
    for (const gain of this.ambientGains) {
      gain.gain.setValueAtTime(
        0.15 * this.globalVolume,
        this.getAudioContext().currentTime
      )
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext()
    }
    // Ensure context is running (browsers may suspend it until user gesture)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(console.error)
    }
    return this.audioCtx
  }

  private playBellTone(frequency: number, duration: number): void {
    const ctx = this.getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(
      this.isMuted ? 0 : 0.5 * this.globalVolume,
      ctx.currentTime
    )
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }

  private synthesizeAmbient(soundName: string): void {
    const ctx = this.getAudioContext()

    if (soundName === 'rain') {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      noise.loop = true

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 800

      const gain = ctx.createGain()
      gain.gain.value = this.isMuted ? 0 : 0.15 * this.globalVolume

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noise.start()

      this.ambientNodes.push(noise)
      this.ambientGains.push(gain)
    } else if (soundName === 'wind-chimes') {
      const playChime = () => {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]
        const freq = notes[Math.floor(Math.random() * notes.length)]
        const duration = 2 + Math.random() * 2

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(
          this.isMuted ? 0 : 0.08 * this.globalVolume,
          ctx.currentTime
        )
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + duration)
      }

      playChime()
      this.ambientIntervalId = window.setInterval(
        playChime,
        3000 + Math.random() * 4000
      )
    } else if (soundName === 'birdsong') {
      const playChirp = () => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(2000, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.1)
        osc.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.15)

        gain.gain.setValueAtTime(
          this.isMuted ? 0 : 0.05 * this.globalVolume,
          ctx.currentTime
        )
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.2)
      }

      playChirp()
      this.ambientIntervalId = window.setInterval(() => {
        if (Math.random() > 0.3) playChirp()
      }, 2000 + Math.random() * 3000)
    }
  }
}
