import '../styles/main.css'
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { createStatCard } from './components/StatCard'
import {
  createCircularProgress,
  updateCircularProgress,
} from './components/CircularProgress'
import { getSettings, createSession, getTodaySessions } from './storage'
import { Timer } from './timer-engine'
import { AudioManager } from './audio'
import { applyTheme } from './theme'

function formatTime(totalSeconds: number): { mm: string; ss: string } {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return {
    mm: String(mins).padStart(2, '0'),
    ss: String(secs).padStart(2, '0'),
  }
}

const TIMER_STATE_KEY = 'sproutdoro-timer-state'

interface TimerStatePersist {
  mode: 'work' | 'shortBreak' | 'longBreak'
  state: 'idle' | 'running' | 'paused'
  remainingSeconds: number
  totalSeconds: number
  sessionCount: number
  lastTick: number | null
}

function saveTimerState(state: TimerStatePersist): void {
  try {
    sessionStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state))
  } catch {
    // sessionStorage may be unavailable in private browsing
  }
}

function loadTimerState(): TimerStatePersist | null {
  try {
    const raw = sessionStorage.getItem(TIMER_STATE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TimerStatePersist
  } catch {
    return null
  }
}

function clearTimerState(): void {
  try {
    sessionStorage.removeItem(TIMER_STATE_KEY)
  } catch {
    // ignore
  }
}

function isDesktop(): boolean {
  return window.innerWidth >= 768
}

async function initTimerPage() {
  let settings: import('../types').Settings
  try {
    settings = await getSettings()
  } catch (err) {
    console.error('Failed to load settings:', err)
    alert('Unable to load timer settings. Please try refreshing the page.')
    return
  }

  applyTheme()

  const audioManager = new AudioManager()
  audioManager.setGlobalVolume(settings.volume / 100)

  // Preload sounds
  const soundsToLoad = [settings.sound, 'completion', 'break']
  for (const name of soundsToLoad) {
    audioManager.loadSound(name, `/sounds/${name}.mp3`)
  }

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
    try {
      const todaySessions = await getTodaySessions()
      todayFocusMinutes = todaySessions
        .filter((s) => s.type === 'work' && s.completed)
        .reduce((sum, s) => sum + s.duration, 0)
    } catch (err) {
      console.error('Failed to load today sessions:', err)
    }

    statsContainer.appendChild(
      createStatCard({
        icon: 'sprout',
        iconBg: 'rgba(81, 98, 51, 0.1)',
        iconColor: '#516233',
        label: 'Session Sprout',
        value: 'Ready',
        delay: 0,
        dataStat: 'session-sprout',
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
        dataStat: 'hydration',
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
        dataStat: 'today-focus',
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
        dataStat: 'growth-stage',
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

  function updateDisplay(state: import('./timer-engine').TimerState) {
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
      const sproutCard = statsContainer.querySelector('[data-stat="session-sprout"]')
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
    audioManager.stopAmbient()
    audioManager.playCompletion()
    if (mode === 'work') {
      const session = {
        id: crypto.randomUUID(),
        startTime: Date.now() - (timer?.getState().totalSeconds || 0) * 1000,
        endTime: Date.now(),
        duration: (timer?.getState().totalSeconds || 0) / 60,
        type: 'work',
        plantId: null,
        category: 'focus',
        completed: true,
      } as import('../types').Session

      try {
        await createSession(session)
      } catch (err) {
        console.error('Failed to save session:', err)
      }

      // Update Today's Focus stat
      let updatedFocusMinutes = 0
      try {
        const todaySessions = await getTodaySessions()
        updatedFocusMinutes = todaySessions
          .filter((s) => s.type === 'work' && s.completed)
          .reduce((sum, s) => sum + s.duration, 0)
      } catch (err) {
        console.error('Failed to refresh today sessions:', err)
      }

      const focusCard = statsContainer?.querySelector('[data-stat="today-focus"]')
      if (focusCard) {
        const valueEl = focusCard.querySelector('.font-headline.text-xl')
        if (valueEl) {
          valueEl.textContent = `${Math.floor(updatedFocusMinutes / 60)}h ${updatedFocusMinutes % 60}m`
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
          try {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
              new Notification('Sproutdoro', {
                body: 'Work session complete! Time for a break.',
                icon: '/favicon.svg',
              })
            }
          } catch (err) {
            console.error('Notification permission error:', err)
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
    clearTimerState()
  }

  timer = new Timer(settings, updateDisplay, onTimerComplete)

  // Restore previous timer state if available
  const savedState = loadTimerState()
  if (savedState) {
    if (savedState.state === 'running' && savedState.lastTick) {
      const elapsed = Math.floor((Date.now() - savedState.lastTick) / 1000)
      savedState.remainingSeconds = Math.max(0, savedState.remainingSeconds - elapsed)
      if (savedState.remainingSeconds <= 0) {
        savedState.state = 'idle'
        clearTimerState()
      }
    }
    if (savedState.state !== 'idle' || savedState.remainingSeconds > 0) {
      timer.restoreState(savedState)
    }
  }

  // Save timer state on every display update
  const originalUpdateDisplay = updateDisplay
  const updateDisplayWithSave = (state: import('./timer-engine').TimerState) => {
    originalUpdateDisplay(state)
    if (state.state === 'complete') {
      clearTimerState()
    } else {
      saveTimerState({
        ...state,
        state: state.state as 'idle' | 'running' | 'paused',
        lastTick: state.state === 'running' ? Date.now() : null,
      })
    }
  }
  timer.onUpdate = updateDisplayWithSave

  updateDisplayWithSave(timer.getState())

  // Button handlers
  if (startPauseBtn) {
    startPauseBtn.addEventListener('click', () => {
      if (!timer) return
      const state = timer.getState()
      if (state.state === 'running') {
        timer.pause()
        audioManager.stopAmbient()
      } else {
        timer.start()
        if (state.mode === 'work') {
          audioManager.startAmbient(settings.sound)
        }
      }
    })
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!timer) return
      timer.reset()
      audioManager.stopAmbient()
      clearTimerState()
    })
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (!timer) return
      timer.skip()
      audioManager.stopAmbient()
    })
  }
}

initTimerPage().catch(console.error)
