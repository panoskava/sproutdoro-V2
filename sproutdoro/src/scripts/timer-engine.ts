import type { Settings } from '../types'

export interface TimerState {
  mode: 'work' | 'shortBreak' | 'longBreak'
  state: 'idle' | 'running' | 'paused' | 'onBreak' | 'complete'
  remainingSeconds: number
  totalSeconds: number
  sessionCount: number
  adjustmentOffset: number
  modeAtAdjustmentStart: 'work' | 'shortBreak' | 'longBreak' | null
  breakBookmark: {
    remainingSeconds: number
    totalSeconds: number
    mode: 'work' | 'shortBreak' | 'longBreak'
    adjustmentOffset: number
  } | null
}

export class Timer {
  private settings: Settings
  onUpdate: (state: TimerState) => void
  private onComplete: (mode: string) => void
  private state: TimerState
  private intervalId: number | null = null
  private transitionTimeoutId: number | null = null

  constructor(
    settings: Settings,
    onUpdate: (state: TimerState) => void,
    onComplete: (mode: string) => void
  ) {
    if (!settings.workDuration || settings.workDuration <= 0) {
      throw new Error('Timer requires workDuration > 0')
    }
    this.settings = settings
    this.onUpdate = onUpdate
    this.onComplete = onComplete
    const totalSeconds = settings.workDuration * 60
    this.state = {
      mode: 'work',
      state: 'idle',
      remainingSeconds: totalSeconds,
      totalSeconds,
      sessionCount: 0,
      adjustmentOffset: 0,
      modeAtAdjustmentStart: null,
      breakBookmark: null,
    }
  }

  private tick() {
    if (this.state.state !== 'running' && this.state.state !== 'onBreak') return
    this.state.remainingSeconds -= 1
    if (this.state.remainingSeconds <= 0) {
      this.state.remainingSeconds = 0
      if (this.state.state === 'onBreak') {
        this.state.state = 'complete'
        this.clearTimer()
        this.onComplete('immediateBreak')
      } else {
        this.state.state = 'complete'
        this.clearTimer()
        const completedMode = this.state.mode
        if (completedMode === 'work') {
          this.state.sessionCount += 1
        }
        this.onComplete(completedMode)
        this.transitionTimeoutId = window.setTimeout(() => {
          this.transitionToNextMode()
        }, 2000)
      }
    }
    this.onUpdate({ ...this.state })
  }

  private transitionToNextMode() {
    let nextMode: 'work' | 'shortBreak' | 'longBreak'
    if (this.state.mode === 'work') {
      if (
        this.state.sessionCount > 0 &&
        this.state.sessionCount % 4 === 0
      ) {
        nextMode = 'longBreak'
      } else {
        nextMode = 'shortBreak'
      }
    } else {
      nextMode = 'work'
    }

    this.state.mode = nextMode
    this.state.state = 'idle'
    this.state.totalSeconds =
      nextMode === 'work'
        ? this.settings.workDuration * 60
        : nextMode === 'shortBreak'
          ? this.settings.shortBreakDuration * 60
          : this.settings.longBreakDuration * 60
    this.state.remainingSeconds = this.state.totalSeconds
    this.onUpdate({ ...this.state })

    if (this.settings.autoStartBreaks && nextMode !== 'work') {
      this.start()
    }
  }

  private clearTimer() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private clearTransitionTimeout() {
    if (this.transitionTimeoutId !== null) {
      window.clearTimeout(this.transitionTimeoutId)
      this.transitionTimeoutId = null
    }
  }

  start() {
    if (this.state.state === 'running') return
    this.clearTransitionTimeout()
    this.state.state = 'running'
    this.onUpdate({ ...this.state })
    this.intervalId = window.setInterval(() => this.tick(), 1000)
  }

  pause() {
    if (this.state.state !== 'running') return
    this.clearTimer()
    this.state.state = 'paused'
    this.onUpdate({ ...this.state })
  }

  resume() {
    if (this.state.state !== 'paused') return
    this.state.state = 'running'
    this.onUpdate({ ...this.state })
    this.intervalId = window.setInterval(() => this.tick(), 1000)
  }

  reset() {
    this.clearTimer()
    this.clearTransitionTimeout()
    this.state.state = 'idle'
    this.state.remainingSeconds = this.state.totalSeconds
    this.onUpdate({ ...this.state })
  }

  pauseForBreak(breakDurationSeconds: number): void {
    if (this.state.mode !== 'work' || (this.state.state !== 'running' && this.state.state !== 'paused')) return
    this.clearTimer()
    this.state.breakBookmark = {
      remainingSeconds: this.state.remainingSeconds,
      totalSeconds: this.state.totalSeconds,
      mode: this.state.mode,
      adjustmentOffset: this.state.adjustmentOffset,
    }
    this.state.mode = 'shortBreak'
    this.state.state = 'onBreak'
    this.state.totalSeconds = breakDurationSeconds
    this.state.remainingSeconds = breakDurationSeconds
    this.onUpdate({ ...this.state })
    this.intervalId = window.setInterval(() => this.tick(), 1000)
  }

  resumeFromBreak(): void {
    if (!this.state.breakBookmark) return
    this.clearTimer()
    this.clearTransitionTimeout()
    const bookmark = this.state.breakBookmark
    this.state.mode = bookmark.mode
    this.state.remainingSeconds = bookmark.remainingSeconds
    this.state.totalSeconds = bookmark.totalSeconds
    this.state.adjustmentOffset = bookmark.adjustmentOffset
    this.state.breakBookmark = null
    this.state.state = 'paused'
    this.onUpdate({ ...this.state })
  }

  skip(): void {
    this.clearTimer()
    this.clearTransitionTimeout()
    if (this.state.breakBookmark && (this.state.state === 'onBreak' || this.state.state === 'complete')) {
      this.resumeFromBreak()
      return
    }
    this.transitionToNextMode()
  }

  adjustTime(deltaSeconds: number): void {
    if (this.state.state !== 'running' && this.state.state !== 'paused') return
    this.state.remainingSeconds = Math.max(0, this.state.remainingSeconds + deltaSeconds)
    this.state.adjustmentOffset += deltaSeconds
    this.state.totalSeconds += deltaSeconds > 0 ? deltaSeconds : 0
    this.onUpdate({ ...this.state })
  }

  getState(): TimerState {
    return { ...this.state }
  }

  restoreState(saved: {
    mode: 'work' | 'shortBreak' | 'longBreak'
    state: 'idle' | 'running' | 'paused' | 'onBreak' | 'complete'
    remainingSeconds: number
    totalSeconds: number
    sessionCount: number
    adjustmentOffset?: number
    modeAtAdjustmentStart?: 'work' | 'shortBreak' | 'longBreak' | null
    breakBookmark?: {
      remainingSeconds: number
      totalSeconds: number
      mode: 'work' | 'shortBreak' | 'longBreak'
      adjustmentOffset: number
    } | null
  }): void {
    this.clearTimer()
    this.clearTransitionTimeout()
    this.state.mode = saved.mode
    this.state.state = saved.state
    this.state.remainingSeconds = saved.remainingSeconds
    this.state.totalSeconds = saved.totalSeconds
    this.state.sessionCount = saved.sessionCount
    this.state.adjustmentOffset = saved.adjustmentOffset ?? 0
    this.state.modeAtAdjustmentStart = saved.modeAtAdjustmentStart ?? null
    this.state.breakBookmark = saved.breakBookmark ?? null
    if (saved.state === 'running' || saved.state === 'onBreak') {
      this.state.state = saved.state
      this.intervalId = window.setInterval(() => this.tick(), 1000)
    }
    this.onUpdate({ ...this.state })
  }
}
