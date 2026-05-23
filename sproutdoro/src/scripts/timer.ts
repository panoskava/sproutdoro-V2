import '../styles/main.css'
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { createStatCard } from './components/StatCard'
import {
  createCircularProgress,
  updateCircularProgress,
} from './components/CircularProgress'
import { getSettings, createSession, getTodaySessions, getCategories, getAllPlants, updatePlant } from './storage'
import { createCategoryPillRow, updateCategoryPillRow } from './components/CategoryPill'
import type { Category } from '../types'
import { Timer } from './timer-engine'
import { AudioManager } from './audio'
import { applyTheme } from './theme'
import { createTimerAdjustButtons, updateTimerAdjustButtonsVisibility } from './components/TimerAdjustButtons'
import { createBreakOverlay, showBreakOverlay, hideBreakOverlay, updateBreakOverlay } from './components/BreakOverlay'
import { getPlantDefinition } from './plant-definitions'

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
  state: 'idle' | 'running' | 'paused' | 'onBreak' | 'complete'
  remainingSeconds: number
  totalSeconds: number
  sessionCount: number
  lastTick: number | null
  adjustmentOffset: number
  modeAtAdjustmentStart: 'work' | 'shortBreak' | 'longBreak' | null
  breakBookmark: {
    remainingSeconds: number
    totalSeconds: number
    mode: 'work' | 'shortBreak' | 'longBreak'
    adjustmentOffset: number
  } | null
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
  let currentCategory: string | null = null
  let sessionStartTime: number | null = null
  let isOnImmediateBreak = false
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

  // Load categories and render pill row
  const categoryRowContainer = document.getElementById('category-pill-row')
  if (categoryRowContainer) {
    let categories: Category[] = []
    try {
      categories = await getCategories()
    } catch (err) {
      console.error('Failed to load categories:', err)
    }

    function handleCategorySelect(categoryId: string | null) {
      currentCategory = categoryId
      const row = document.getElementById('category-pill-row')
      if (row) {
        updateCategoryPillRow(row, categories, categoryId, handleCategorySelect)
      }
    }

    const pillRow = createCategoryPillRow({
      categories,
      selectedCategoryId: null,
      onSelect: handleCategorySelect,
    })
    categoryRowContainer.appendChild(pillRow)
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

    const showAdjust = state.state === 'running' || state.state === 'paused'
    updateTimerAdjustButtonsVisibility(showAdjust)

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

    const immediateBreakBtn = document.getElementById('btn-immediate-break')
    if (immediateBreakBtn) {
      if (state.mode === 'work' && (state.state === 'running' || state.state === 'paused')) {
        immediateBreakBtn.classList.remove('hidden')
        immediateBreakBtn.classList.add('md:flex')
      } else {
        immediateBreakBtn.classList.add('hidden')
        immediateBreakBtn.classList.remove('md:flex')
      }
    }

    if (state.state === 'onBreak') {
      updateBreakOverlay(state.remainingSeconds, state.totalSeconds)
    }
  }

  async function onTimerComplete(mode: string) {
    audioManager.stopAmbient()

    if (mode === 'immediateBreak') {
      if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Sproutdoro', {
          body: 'Break over! Resuming focus session.',
          icon: '/favicon.svg',
        })
      }
      hideBreakOverlay()
      timer?.resumeFromBreak()
      isOnImmediateBreak = false
      updateTimerAdjustButtonsVisibility(true)
      clearTimerState()
      return
    }

    audioManager.playCompletion()
    if (mode === 'work') {
      const timerState = timer?.getState()
      const actualDuration = timerState
        ? Math.round(((timerState.totalSeconds - (timerState.adjustmentOffset ?? 0)) / 60) * 10) / 10
        : 0
      const session = {
        id: crypto.randomUUID(),
        startTime: sessionStartTime ?? (Date.now() - ((timerState?.totalSeconds || 0) * 1000)),
        endTime: Date.now(),
        duration: actualDuration > 0 ? actualDuration : (timerState?.totalSeconds || 0) / 60,
        type: 'work',
        plantId: null,
        category: currentCategory,
        completed: true,
      } as import('../types').Session

      try {
        await createSession(session)
      } catch (err) {
        console.error('Failed to save session:', err)
      }

      // Update active plants with focus minutes
      try {
        const allPlants = await getAllPlants()
        for (const plant of allPlants) {
          if (!plant.sessionIds) plant.sessionIds = []
          plant.sessionIds.push(session.id)
          plant.totalFocusMinutes += session.duration
          const definition = getPlantDefinition(plant.type)
          if (definition) {
            const progressRatio = plant.totalFocusMinutes / definition.focusMinutesRequired
            if (progressRatio >= 1 && plant.level < 5) {
              plant.level = Math.min(5, Math.floor(progressRatio) + 1) as 1 | 2 | 3 | 4 | 5
            }
            if (plant.level >= 5) {
              plant.isMasterpiece = true
            }
          }
          await updatePlant(plant)
        }
      } catch (err) {
        console.error('Failed to update plants:', err)
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
      // If restoring an onBreak state, show the overlay
      if (savedState.state === 'onBreak' && savedState.breakBookmark) {
        isOnImmediateBreak = true
        showBreakOverlay()
        updateTimerAdjustButtonsVisibility(false)
      }
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
        state: state.state as 'idle' | 'running' | 'paused' | 'onBreak' | 'complete',
        lastTick: (state.state === 'running' || state.state === 'onBreak') ? Date.now() : null,
        adjustmentOffset: state.adjustmentOffset ?? 0,
        modeAtAdjustmentStart: state.modeAtAdjustmentStart ?? null,
        breakBookmark: state.breakBookmark ?? null,
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
        if (state.mode === 'work' && (state.state === 'idle' || state.state === 'complete')) {
          sessionStartTime = Date.now()
        }
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
      if (isOnImmediateBreak) {
        hideBreakOverlay()
        isOnImmediateBreak = false
      }
      timer.reset()
      audioManager.stopAmbient()
      clearTimerState()
      updateTimerAdjustButtonsVisibility(false)
    })
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (!timer) return
      if (isOnImmediateBreak) {
        hideBreakOverlay()
        isOnImmediateBreak = false
        updateTimerAdjustButtonsVisibility(true)
      }
      timer.skip()
      audioManager.stopAmbient()
    })
  }

  const ADJUST_AMOUNT_MINUTES = settings.timerAdjustMinutes || 5
  const adjustContainer = document.getElementById('timer-adjust-container')
  if (adjustContainer) {
    const adjustButtons = createTimerAdjustButtons({
      onIncrement: () => {
        if (timer) timer.adjustTime(ADJUST_AMOUNT_MINUTES * 60)
      },
      onDecrement: () => {
        if (timer) timer.adjustTime(-(ADJUST_AMOUNT_MINUTES * 60))
      },
      adjustAmount: ADJUST_AMOUNT_MINUTES,
      isVisible: false,
    })
    adjustContainer.appendChild(adjustButtons)
  }

  const breakOverlayContainer = document.getElementById('break-overlay-container')
  if (breakOverlayContainer) {
    const breakDurationSec = settings.shortBreakDuration * 60
    const breakOverlay = createBreakOverlay({
      breakDuration: breakDurationSec,
      onBreakComplete: () => {
        if (!timer) return
        hideBreakOverlay()
        timer.resumeFromBreak()
        isOnImmediateBreak = false
        updateTimerAdjustButtonsVisibility(true)
      },
      onCancelBreak: () => {
        if (!timer) return
        hideBreakOverlay()
        timer.resumeFromBreak()
        isOnImmediateBreak = false
        updateTimerAdjustButtonsVisibility(true)
      },
    })
    breakOverlayContainer.appendChild(breakOverlay)
  }

  const immediateBreakBtn = document.getElementById('btn-immediate-break')
  if (immediateBreakBtn) {
    immediateBreakBtn.addEventListener('click', () => {
      if (!timer) return
      const state = timer.getState()
      if (state.mode !== 'work' || (state.state !== 'running' && state.state !== 'paused')) return
      isOnImmediateBreak = true
      const breakDurationSec = settings.shortBreakDuration * 60
      timer.pauseForBreak(breakDurationSec)
      showBreakOverlay()
      updateTimerAdjustButtonsVisibility(false)
    })
  }
}

initTimerPage().catch(console.error)
