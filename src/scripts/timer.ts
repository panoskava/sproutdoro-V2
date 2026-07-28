import '../styles/main.css'
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { createStatCard } from './components/StatCard'
import { showToast } from './components/Toast'
import { injectSiteFooter } from './components/SiteFooter'
import { showWelcomeModal } from './components/WelcomeModal'
import { createShortcutsButton, toggleShortcutsOverlay } from './components/ShortcutsOverlay'
import { initInstallBanner, markFirstSessionComplete } from './components/InstallBanner'
import { bootstrapPage } from './init'
import { setPageMeta } from './meta'
import { parseTimerState, type TimerStatePersist } from './validation'
import { getSettings, createSession, getTodaySessions, getCategories, updatePlant, getActivePlant, pickWeightedPlantType, createPlant } from './storage'
import { createCategoryPillRow, updateCategoryPillRow } from './components/CategoryPill'
import type { Category } from '../types'
import { Timer } from './timer-engine'
import { AudioManager } from './audio'
import { applyTheme } from './theme'
import { createTimerAdjustButtons, updateTimerAdjustButtonsVisibility } from './components/TimerAdjustButtons'
import { createBreakOverlay, showBreakOverlay, hideBreakOverlay, updateBreakOverlay } from './components/BreakOverlay'
import { getPlantDefinition } from './plant-definitions'

import { createSessionDots, updateSessionDots } from './components/SessionDots'
import { createClockDial, updateClockDial } from './components/ClockDial'
import { setupMediaSession, updateMediaSession, startSilentPlayback } from './media-session-manager'
import {
  initPWANotifications,
  requestPWANotificationPermission,
  updatePWANotification,
  closePWANotification,
} from './pwa-notification-manager'

function formatTime(totalSeconds: number): { mm: string; ss: string } {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return {
    mm: String(mins).padStart(2, '0'),
    ss: String(secs).padStart(2, '0'),
  }
}

const TIMER_STATE_KEY = 'sproutdoro-timer-state'

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
    return parseTimerState(JSON.parse(raw))
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
  closePWANotification()
}

function isDesktop(): boolean {
  return window.innerWidth >= 768
}

const faviconUrl = `${import.meta.env.BASE_URL}favicon.svg`
const soundBase = `${import.meta.env.BASE_URL}sounds/`

async function initTimerPage() {
  setPageMeta({
    title: 'Focus Timer',
    description: 'A garden-themed Pomodoro timer. Plant seeds, focus deeply, and grow your garden.',
    path: 'index.html',
  })

  let settings: import('../types').Settings
  try {
    settings = await getSettings()
  } catch (err) {
    console.error('Failed to load settings:', err)
    showToast('Unable to load timer settings. Please try refreshing the page.', 'error')
    return
  }

  applyTheme()
  initInstallBanner()
  showWelcomeModal()

  const audioManager = new AudioManager()
  audioManager.setGlobalVolume(settings.volume / 100)

  // Preload sounds
  const soundsToLoad = [settings.sound, 'completion', 'break']
  for (const name of soundsToLoad) {
    audioManager.loadSound(name, `${soundBase}${name}.mp3`)
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

  // No active plant banner
  const activePlant = await getActivePlant()
  if (!activePlant) {
    const banner = document.getElementById('no-plant-banner')
    if (banner) banner.classList.remove('hidden')
  }

  // Aria-live region for timer announcements
  const liveRegion = document.createElement('div')
  liveRegion.id = 'timer-live-region'
  liveRegion.className = 'sr-only'
  liveRegion.setAttribute('aria-live', 'polite')
  liveRegion.setAttribute('aria-atomic', 'true')
  document.body.appendChild(liveRegion)

  let lastAnnouncedMinute = -1

  // Timer display elements
  const timeMins = document.getElementById('time-mins')
  const timeSecs = document.getElementById('time-secs')
  const startPauseBtn = document.getElementById('btn-start-pause')
  const resetBtn = document.getElementById('btn-reset')
  const skipBtn = document.getElementById('btn-skip')

  // Render session dots
  const sessionDotsContainer = document.getElementById('session-dots-container')
  if (sessionDotsContainer) {
    sessionDotsContainer.appendChild(createSessionDots(0, 5))
  }

  // Render clock dial SVG
  const clockDialContainer = document.getElementById('clock-dial-container')
  let clockDialSvg: SVGSVGElement | null = null
  if (clockDialContainer) {
    const size = isDesktop() ? 360 : 280
    clockDialSvg = createClockDial({ size, progress: 0, accentColor: '#516233' })
    clockDialContainer.appendChild(clockDialSvg)
  }

  setupMediaSession({
    onPlay: () => {
      if (!timer) return
      const state = timer.getState()
      if (state.state !== 'running') {
        timer.start()
        if (state.mode === 'work') audioManager.startAmbient(settings.sound)
      }
    },
    onPause: () => {
      if (!timer) return
      const state = timer.getState()
      if (state.state === 'running') {
        timer.pause()
        audioManager.stopAmbient()
      }
    },
    onSkip: () => {
      if (!timer) return
      timer.skip()
      audioManager.stopAmbient()
    },
    onBreak: () => {
      if (!timer) return
      const state = timer.getState()
      if (state.mode === 'work' && (state.state === 'running' || state.state === 'paused')) {
        isOnImmediateBreak = true
        const breakDurationSec = settings.shortBreakDuration * 60
        timer.pauseForBreak(breakDurationSec)
        showBreakOverlay()
        updateTimerAdjustButtonsVisibility(true)
      }
    },
  })

  initPWANotifications({
    onPause: () => {
      if (!timer) return
      if (timer.getState().state === 'running') {
        timer.pause()
        audioManager.stopAmbient()
      }
    },
    onResume: () => {
      if (!timer) return
      timer.start()
      if (timer.getState().mode === 'work') audioManager.startAmbient(settings.sound)
    },
    onBreak: () => {
      if (!timer) return
      const state = timer.getState()
      if (state.mode === 'work' && (state.state === 'running' || state.state === 'paused')) {
        isOnImmediateBreak = true
        const breakDurationSec = settings.shortBreakDuration * 60
        timer.pauseForBreak(breakDurationSec)
        showBreakOverlay()
        updateTimerAdjustButtonsVisibility(true)
      }
    },
    onSkip: () => {
      if (!timer) return
      timer.skip()
      audioManager.stopAmbient()
    },
  })

  const intentionInput = document.getElementById('intention-input') as HTMLInputElement | null
  const primaryActionBtn = document.getElementById('btn-primary-action')
  const primaryActionIcon = document.getElementById('primary-action-icon')
  const primaryActionLabel = document.getElementById('primary-action-label')
  const controlBreakBtn = document.getElementById('btn-control-break')

  function formatClockTime(date: Date): string {
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }

  function updateTimeRangePill(remainingSeconds: number) {
    const pill = document.getElementById('time-range-pill')
    if (!pill) return
    const now = new Date()
    const endTime = new Date(now.getTime() + remainingSeconds * 1000)
    pill.textContent = `${formatClockTime(now)} → ${formatClockTime(endTime)}`
  }

  let timer: Timer | null = null

  function updateDisplay(state: import('./timer-engine').TimerState) {
    const { mm, ss } = formatTime(state.remainingSeconds)
    if (timeMins) timeMins.textContent = mm
    if (timeSecs) timeSecs.textContent = ss

    const modeLabel = state.mode === 'work' ? 'Focus' : state.mode === 'shortBreak' ? 'Short break' : 'Long break'
    if (state.state === 'running') {
      document.title = `${mm}:${ss} - ${modeLabel} | Sproutdoro`
    } else if (state.state === 'paused') {
      document.title = `[Paused] ${mm}:${ss} - Sproutdoro`
    } else {
      document.title = 'Sproutdoro - Focus Timer'
    }

    const progress =
      state.totalSeconds > 0
        ? 1 - state.remainingSeconds / state.totalSeconds
        : 0

    // Update Session Dots
    if (sessionDotsContainer) {
      updateSessionDots(sessionDotsContainer, state.sessionCount, 5)
    }

    // Update Clock Dial
    if (clockDialSvg) {
      const accentColor = state.mode === 'work' ? '#516233' : state.mode === 'shortBreak' ? '#934a29' : '#3f5d87'
      updateClockDial(clockDialSvg, progress, accentColor)
    }

    // Update Time Range Pill
    updateTimeRangePill(state.remainingSeconds)

    // Update Primary Action Button
    if (primaryActionLabel && primaryActionIcon) {
      if (state.state === 'running') {
        primaryActionLabel.textContent = 'PAUSE SESSION'
        primaryActionIcon.textContent = 'pause'
      } else if (state.state === 'paused') {
        primaryActionLabel.textContent = 'RESUME SESSION'
        primaryActionIcon.textContent = 'play_arrow'
      } else {
        primaryActionLabel.textContent = state.mode === 'work' ? 'START SESSION' : 'START BREAK'
        primaryActionIcon.textContent = 'play_arrow'
      }
    }

    // Update Media Session OS Notification
    updateMediaSession(
      state.state,
      state.mode,
      `${mm}:${ss}`,
      state.totalSeconds,
      state.remainingSeconds,
      intentionInput?.value?.trim() || undefined
    )

    // Update PWA Service Worker System Notification
    updatePWANotification(
      state.state,
      state.mode,
      `${mm}:${ss}`,
      intentionInput?.value?.trim() || undefined
    )

    const showAdjust = state.state === 'running' || state.state === 'paused' || state.state === 'onBreak'
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

    if (state.state === 'onBreak') {
      updateBreakOverlay(state.remainingSeconds, state.totalSeconds)
    }

    const currentMinute = Math.floor(state.remainingSeconds / 60)
    if (state.state === 'running' && currentMinute !== lastAnnouncedMinute) {
      lastAnnouncedMinute = currentMinute
      liveRegion.textContent = `${modeLabel}: ${mm} minutes ${ss} seconds remaining`
    }
    if (state.state === 'idle' || state.state === 'paused') {
      lastAnnouncedMinute = -1
    }
  }

  async function onTimerComplete(mode: string) {
    audioManager.stopAmbient()

    if (mode === 'immediateBreak') {
      hideBreakOverlay()
      timer?.resumeFromBreak()
      isOnImmediateBreak = false
      updateTimerAdjustButtonsVisibility(true)
      clearTimerState()
      return
    }

    audioManager.playCompletion()
    if (mode === 'work') {
      markFirstSessionComplete()
      const timerState = timer?.getState()
      const actualDuration = timerState
        ? Math.round(((timerState.totalSeconds) / 60) * 10) / 10
        : 0
      const session = {
        id: crypto.randomUUID(),
        startTime: sessionStartTime ?? (Date.now() - ((timerState?.totalSeconds || 0) * 1000)),
        endTime: Date.now(),
        duration: actualDuration > 0 ? actualDuration : (timerState?.totalSeconds || 0) / 60,
        type: 'work',
        plantId: null,
        category: currentCategory,
        intention: intentionInput?.value?.trim() || undefined,
        completed: true,
      } as import('../types').Session

      try {
        await createSession(session)
      } catch (err) {
        console.error('Failed to save session:', err)
      }

      // Attribute session minutes to single active plant (or create new one)
      try {
        const activePlant = await getActivePlant()
        if (activePlant) {
          if (!activePlant.sessionIds) activePlant.sessionIds = []
          activePlant.sessionIds.push(session.id)
          activePlant.totalFocusMinutes += session.duration

          const definition = getPlantDefinition(activePlant.type)
          if (definition) {
            const progressRatio = activePlant.totalFocusMinutes / definition.focusMinutesRequired
            const newLevel = Math.min(5, Math.floor(progressRatio * 4) + 1) as 1 | 2 | 3 | 4 | 5
            if (newLevel > activePlant.level) {
              activePlant.level = newLevel
            }
            activePlant.isMasterpiece = activePlant.level >= 5
          }
          await updatePlant(activePlant)
        } else {
          // No active plant — plant a new seed via weighted rarity
          const definition = pickWeightedPlantType()
          const newPlant: import('../types').Plant = {
            id: crypto.randomUUID(),
            type: definition.id,
            rarity: definition.rarity,
            level: 1,
            plantedAt: Date.now(),
            totalFocusMinutes: session.duration,
            sessionIds: [session.id],
            isMasterpiece: false,
          }
          await createPlant(newPlant)
        }
      } catch (err) {
        console.error('Failed to update or create plant:', err)
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
            icon: faviconUrl,
          })
        } else if (Notification.permission !== 'denied') {
          try {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
              new Notification('Sproutdoro', {
                body: 'Work session complete! Time for a break.',
                icon: faviconUrl,
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
            icon: faviconUrl,
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
      const elapsed = Math.max(0, Math.floor((Date.now() - savedState.lastTick) / 1000))
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
  const handleTogglePlay = () => {
    if (!timer) return
    const state = timer.getState()
    if (state.state === 'running') {
      timer.pause()
      audioManager.stopAmbient()
    } else {
      if (state.mode === 'work' && (state.state === 'idle' || state.state === 'complete')) {
        sessionStartTime = Date.now()
      }
      // Request PWA notification permission and start silent audio on user gesture
      requestPWANotificationPermission()
      startSilentPlayback()
      timer.start()
      if (state.mode === 'work') {
        audioManager.startAmbient(settings.sound)
      }
    }
  }

  if (primaryActionBtn) {
    primaryActionBtn.addEventListener('click', handleTogglePlay)
  }

  if (startPauseBtn) {
    startPauseBtn.addEventListener('click', handleTogglePlay)
  }

  if (controlBreakBtn) {
    controlBreakBtn.addEventListener('click', () => {
      if (!timer) return
      const state = timer.getState()
      if (state.mode !== 'work' || (state.state !== 'running' && state.state !== 'paused')) return
      startSilentPlayback()
      isOnImmediateBreak = true
      const breakDurationSec = settings.shortBreakDuration * 60
      timer.pauseForBreak(breakDurationSec)
      showBreakOverlay()
      updateTimerAdjustButtonsVisibility(true)
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

  const ADJUST_AMOUNT_MINUTES = 3
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

  const controlsRow = document.getElementById('timer-controls')
  if (controlsRow) {
    controlsRow.appendChild(createShortcutsButton())
  }

  injectSiteFooter()

  function isTypingTarget(): boolean {
    const el = document.activeElement
    if (!el) return false
    const tag = el.tagName
    const role = el.getAttribute('role')
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || role === 'button' || (el as HTMLElement).isContentEditable
  }

  document.addEventListener('keydown', (e) => {
    if (isTypingTarget()) return
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault()
      startPauseBtn?.click()
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault()
      resetBtn?.click()
    } else if (e.key === '?') {
      e.preventDefault()
      toggleShortcutsOverlay()
    }
  })
}

bootstrapPage(initTimerPage).catch(console.error)
