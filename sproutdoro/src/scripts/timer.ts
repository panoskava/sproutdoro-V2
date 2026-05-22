import '../styles/main.css'
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { createStatCard } from './components/StatCard'
import {
  createCircularProgress,
  updateCircularProgress,
} from './components/CircularProgress'
import { getSettings, createSession, getTodaySessions } from './storage'
import type { Settings, Session } from '../types'

export interface TimerState {
  mode: 'work' | 'shortBreak' | 'longBreak'
  state: 'idle' | 'running' | 'paused' | 'complete'
  remainingSeconds: number
  totalSeconds: number
  sessionCount: number
}

export class Timer {
  private settings: Settings
  private onUpdate: (state: TimerState) => void
  private onComplete: (mode: string) => void
  private state: TimerState
  private intervalId: number | null = null
  private transitionTimeoutId: number | null = null

  constructor(
    settings: Settings,
    onUpdate: (state: TimerState) => void,
    onComplete: (mode: string) => void
  ) {
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
    }
  }

  private tick() {
    if (this.state.state !== 'running') return
    this.state.remainingSeconds -= 1
    if (this.state.remainingSeconds <= 0) {
      this.state.remainingSeconds = 0
      this.state.state = 'complete'
      this.clearInterval()
      const completedMode = this.state.mode
      if (completedMode === 'work') {
        this.state.sessionCount += 1
      }
      this.onComplete(completedMode)
      this.transitionTimeoutId = window.setTimeout(() => {
        this.transitionToNextMode()
      }, 2000)
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

  private clearInterval() {
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
    this.clearInterval()
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
    this.clearInterval()
    this.clearTransitionTimeout()
    this.state.state = 'idle'
    this.state.remainingSeconds = this.state.totalSeconds
    this.onUpdate({ ...this.state })
  }

  skip() {
    this.clearInterval()
    this.clearTransitionTimeout()
    this.transitionToNextMode()
  }

  getState(): TimerState {
    return { ...this.state }
  }
}

/* ------------------------------------------------------------------ */
/* Page setup                                                         */
/* ------------------------------------------------------------------ */

function formatTime(totalSeconds: number): { mm: string; ss: string } {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return {
    mm: String(mins).padStart(2, '0'),
    ss: String(secs).padStart(2, '0'),
  }
}

function isDesktop(): boolean {
  return window.innerWidth >= 768
}

async function initTimerPage() {
  const settings = await getSettings()

  // Render navs
  const sideNavContainer = document.getElementById('side-nav')
  if (sideNavContainer) {
    sideNavContainer.appendChild(createSideNav('focus'))
  }

  const mobileNavContainer = document.getElementById('mobile-nav')
  if (mobileNavContainer) {
    mobileNavContainer.appendChild(createMobileNav('focus'))
  }

  // Render stat cards
  const statsContainer = document.getElementById('stats-row')
  let todayFocusMinutes = 0
  if (statsContainer) {
    const todaySessions = await getTodaySessions()
    todayFocusMinutes = todaySessions
      .filter((s) => s.type === 'work' && s.completed)
      .reduce((sum, s) => sum + s.duration, 0)

    statsContainer.appendChild(
      createStatCard({
        icon: 'sprout',
        iconBg: 'rgba(81, 98, 51, 0.1)',
        iconColor: '#516233',
        label: 'Session Sprout',
        value: 'Ready',
        delay: 0,
      })
    )

    statsContainer.appendChild(
      createStatCard({
        icon: 'water_drop',
        iconBg: 'rgba(147, 74, 41, 0.1)',
        iconColor: '#934a29',
        label: 'Hydration',
        value: '100%',
        delay: 100,
      })
    )

    statsContainer.appendChild(
      createStatCard({
        icon: 'schedule',
        iconBg: 'rgba(63, 93, 135, 0.1)',
        iconColor: '#3f5d87',
        label: "Today's Focus",
        value: `${Math.floor(todayFocusMinutes / 60)}h ${todayFocusMinutes % 60}m`,
        delay: 200,
      })
    )

    statsContainer.appendChild(
      createStatCard({
        icon: 'eco',
        iconBg: 'rgba(81, 98, 51, 0.1)',
        iconColor: '#516233',
        label: 'Growth Stage',
        value: 'Seedling',
        delay: 300,
      })
    )
  }

  // Update session goal text
  const sessionGoalEl = document.getElementById('session-goal')
  if (sessionGoalEl) {
    sessionGoalEl.textContent = `Session Goal: Deep Focus (${settings.workDuration}m)`
  }

  // Timer display elements
  const timeMins = document.getElementById('time-mins')
  const timeSecs = document.getElementById('time-secs')
  const timerRingContainer = document.getElementById('timer-ring')
  const startPauseBtn = document.getElementById('btn-start-pause')
  const resetBtn = document.getElementById('btn-reset')
  const skipBtn = document.getElementById('btn-skip')

  // Create progress ring
  let timerCircle: SVGSVGElement | null = null
  if (timerRingContainer) {
    const size = isDesktop() ? 480 : 320
    timerCircle = createCircularProgress({
      size,
      strokeWidth: 12,
      progress: 0,
      color: '#516233',
      trackColor: 'rgba(81, 98, 51, 0.1)',
      showSunDot: true,
      sunDotColor: '#fd9e77',
    })
    timerCircle.style.width = '100%'
    timerCircle.style.height = '100%'
    timerRingContainer.appendChild(timerCircle)
  }

  let timer: Timer | null = null

  function updateDisplay(state: TimerState) {
    const { mm, ss } = formatTime(state.remainingSeconds)
    if (timeMins) timeMins.textContent = mm
    if (timeSecs) timeSecs.textContent = ss

    // Update progress ring
    if (timerCircle) {
      const progress =
        state.totalSeconds > 0
          ? 1 - state.remainingSeconds / state.totalSeconds
          : 0
      const size = isDesktop() ? 480 : 320
      updateCircularProgress(timerCircle, progress, { size, strokeWidth: 12 })
    }

    // Update button icon
    if (startPauseBtn) {
      const icon =
        state.state === 'running'
          ? 'pause'
          : 'play_arrow'
      startPauseBtn.innerHTML = `
        <span class="material-symbols-outlined text-2xl md:text-3xl" style="font-variation-settings: 'FILL' 1, 'wght' 600;">${icon}</span>
      `
    }

    // Update Session Sprout stat
    if (statsContainer && state.mode === 'work') {
      const sproutCard = statsContainer.children[0]
      if (sproutCard) {
        const valueEl = sproutCard.querySelector('.font-headline.text-xl')
        if (valueEl) {
          if (state.state === 'running') {
            valueEl.textContent = 'Growing...'
          } else if (state.state === 'complete') {
            valueEl.textContent = 'Bloomed!'
          } else {
            valueEl.textContent = 'Ready'
          }
        }
      }
    }
  }

  async function onTimerComplete(mode: string) {
    if (mode === 'work') {
      const session: Session = {
        id: crypto.randomUUID(),
        startTime: Date.now() - (timer?.getState().totalSeconds || 0) * 1000,
        endTime: Date.now(),
        duration: (timer?.getState().totalSeconds || 0) / 60,
        type: 'work',
        plantId: null,
        category: 'focus',
        completed: true,
      }
      await createSession(session)

      // Update Today's Focus stat
      const todaySessions = await getTodaySessions()
      const updatedFocusMinutes = todaySessions
        .filter((s) => s.type === 'work' && s.completed)
        .reduce((sum, s) => sum + s.duration, 0)
      if (statsContainer) {
        const focusCard = statsContainer.children[2]
        if (focusCard) {
          const valueEl = focusCard.querySelector('.font-headline.text-xl')
          if (valueEl) {
            valueEl.textContent = `${Math.floor(updatedFocusMinutes / 60)}h ${updatedFocusMinutes % 60}m`
          }
        }
      }

      // Show notification
      if (settings.notifications && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Sproutdoro', {
            body: 'Work session complete! Time for a break.',
            icon: '/favicon.svg',
          })
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            new Notification('Sproutdoro', {
              body: 'Work session complete! Time for a break.',
              icon: '/favicon.svg',
            })
          }
        }
      }
    } else {
      if (settings.notifications && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Sproutdoro', {
            body: 'Break over! Ready to focus?',
            icon: '/favicon.svg',
          })
        }
      }
    }
  }

  timer = new Timer(settings, updateDisplay, onTimerComplete)
  updateDisplay(timer.getState())

  // Button handlers
  if (startPauseBtn) {
    startPauseBtn.addEventListener('click', () => {
      if (!timer) return
      const state = timer.getState()
      if (state.state === 'running') {
        timer.pause()
      } else {
        timer.start()
      }
    })
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!timer) return
      timer.reset()
    })
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (!timer) return
      timer.skip()
    })
  }

  // Handle resize for progress ring
  window.addEventListener('resize', () => {
    if (!timer || !timerCircle) return
    const state = timer.getState()
    const progress =
      state.totalSeconds > 0
        ? 1 - state.remainingSeconds / state.totalSeconds
        : 0
    const size = isDesktop() ? 480 : 320
    updateCircularProgress(timerCircle, progress, { size, strokeWidth: 12 })
  })
}

initTimerPage().catch(console.error)
