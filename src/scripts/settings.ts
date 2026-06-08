import '../styles/main.css'
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { createRangeSlider } from './components/RangeSlider'
import { createToggleSwitch } from './components/ToggleSwitch'
import { createSoundCard } from './components/SoundCard'
import {
  getSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  getCategories,
  exportAllData,
  importAllData,
} from './storage'
import type { Settings } from '../types'
import { createCategoryManager } from './components/CategoryManager'
import { applyTheme, setTheme } from './theme'
import { showToast } from './components/Toast'
import { showConfirmDialog } from './components/ConfirmDialog'
import { injectSiteFooter } from './components/SiteFooter'
import { bootstrapPage } from './init'
import { setPageMeta } from './meta'

const REPO_URL = 'https://github.com/panoskava/sproutdoro-V2'
const ISSUES_URL = 'https://github.com/panoskava/sproutdoro-V2/issues/new'

function updateSoundCardVisuals(card: Element, selected: boolean) {
  if (selected) {
    card.classList.add('ring-2', 'ring-primary', 'bg-primary/5', 'border-primary')
    card.classList.remove(
      'border-outline-variant/50',
      'bg-white/40',
      'hover:bg-white/60',
      'hover:-translate-y-0.5'
    )
  } else {
    card.classList.remove('ring-2', 'ring-primary', 'bg-primary/5', 'border-primary')
    card.classList.add(
      'border-outline-variant/50',
      'bg-white/40',
      'hover:bg-white/60',
      'hover:-translate-y-0.5'
    )
  }
}

async function initSettingsPage() {
  setPageMeta({
    title: 'Settings',
    description: 'Customize timer durations, sounds, themes, and focus categories.',
    path: 'settings.html',
  })

  let settings: Settings
  try {
    settings = await getSettings()
  } catch (err) {
    console.error('Failed to load settings:', err)
    showToast('Unable to load settings. Please try refreshing the page.', 'error')
    return
  }

  applyTheme()

  const sideNavContainer = document.getElementById('side-nav')
  if (sideNavContainer) {
    sideNavContainer.appendChild(createSideNav('config'))
  }

  const mobileNavContainer = document.getElementById('mobile-nav')
  if (mobileNavContainer) {
    mobileNavContainer.appendChild(createMobileNav('config'))
  }

  async function persistSettings() {
    try {
      await saveSettings(settings)
    } catch (err) {
      console.error('Failed to save settings:', err)
      showToast('Failed to save settings. Please try again.', 'error')
    }
  }

  const timerSlidersContainer = document.getElementById('timer-durations-sliders')
  if (timerSlidersContainer) {
    timerSlidersContainer.appendChild(
      createRangeSlider({
        label: 'Work Duration',
        min: 1,
        max: 60,
        value: settings.workDuration,
        unit: ' min',
        accentColor: '#516233',
        onChange: async (value) => {
          settings.workDuration = value
          await persistSettings()
        },
      })
    )

    timerSlidersContainer.appendChild(
      createRangeSlider({
        label: 'Short Break',
        min: 1,
        max: 15,
        value: settings.shortBreakDuration,
        unit: ' min',
        accentColor: '#934a29',
        onChange: async (value) => {
          settings.shortBreakDuration = value
          await persistSettings()
        },
      })
    )

    timerSlidersContainer.appendChild(
      createRangeSlider({
        label: 'Long Break',
        min: 5,
        max: 45,
        value: settings.longBreakDuration,
        unit: ' min',
        accentColor: '#3f5d87',
        onChange: async (value) => {
          settings.longBreakDuration = value
          await persistSettings()
        },
      })
    )
  }

  const adjustSliderContainer = document.getElementById('timer-adjust-setting')
  if (adjustSliderContainer) {
    adjustSliderContainer.appendChild(
      createRangeSlider({
        label: 'Adjust Amount',
        min: 1,
        max: 15,
        value: settings.timerAdjustMinutes,
        unit: ' min',
        accentColor: '#76786c',
        onChange: async (value) => {
          settings.timerAdjustMinutes = value
          await persistSettings()
        },
      })
    )
  }

  const appearanceContainer = document.getElementById('appearance-toggle')
  if (appearanceContainer) {
    const themeLabel = document.createElement('span')
    themeLabel.className = 'font-label text-sm text-on-surface/70'
    themeLabel.textContent = 'Choose your preferred theme'
    appearanceContainer.appendChild(themeLabel)

    const themeButtons = document.createElement('div')
    themeButtons.className =
      'flex items-center gap-2 p-1 bg-surface-container-high/50 rounded-full self-start'

    const lightBtn = document.createElement('button')
    lightBtn.className = `px-4 py-2 rounded-full font-label text-sm font-semibold transition-all duration-200 ${
      settings.theme === 'light'
        ? 'bg-primary text-on-primary shadow-sm'
        : 'text-on-surface/60 hover:text-on-surface'
    }`
    lightBtn.textContent = 'Light'

    const darkBtn = document.createElement('button')
    darkBtn.className = `px-4 py-2 rounded-full font-label text-sm font-semibold transition-all duration-200 ${
      settings.theme === 'dark'
        ? 'bg-primary text-on-primary shadow-sm'
        : 'text-on-surface/60 hover:text-on-surface'
    }`
    darkBtn.textContent = 'Dark'

    async function setThemeLocal(theme: 'light' | 'dark') {
      settings.theme = theme
      setTheme(theme)
      await persistSettings()
      lightBtn.className = `px-4 py-2 rounded-full font-label text-sm font-semibold transition-all duration-200 ${
        theme === 'light'
          ? 'bg-primary text-on-primary shadow-sm'
          : 'text-on-surface/60 hover:text-on-surface'
      }`
      darkBtn.className = `px-4 py-2 rounded-full font-label text-sm font-semibold transition-all duration-200 ${
        theme === 'dark'
          ? 'bg-primary text-on-primary shadow-sm'
          : 'text-on-surface/60 hover:text-on-surface'
      }`
    }

    lightBtn.addEventListener('click', () => setThemeLocal('light'))
    darkBtn.addEventListener('click', () => setThemeLocal('dark'))

    themeButtons.appendChild(lightBtn)
    themeButtons.appendChild(darkBtn)
    appearanceContainer.appendChild(themeButtons)
  }

  const soundCardsContainer = document.getElementById('sound-cards')
  if (soundCardsContainer) {
    const sounds: Array<{
      id: Settings['sound']
      icon: string
      name: string
      description: string
      accentColor: string
    }> = [
      {
        id: 'wind-chimes',
        icon: 'wind_power',
        name: 'Wind Chimes',
        description: 'Gentle, melodic tones',
        accentColor: '#516233',
      },
      {
        id: 'birdsong',
        icon: 'flutter_mode',
        name: 'Birdsong',
        description: 'Cheerful morning birds',
        accentColor: '#934a29',
      },
      {
        id: 'rain',
        icon: 'water_drop',
        name: 'Rain',
        description: 'Soft, steady rainfall',
        accentColor: '#3f5d87',
      },
    ]

    for (const sound of sounds) {
      const card = createSoundCard({
        icon: sound.icon,
        name: sound.name,
        description: sound.description,
        selected: settings.sound === sound.id,
        accentColor: sound.accentColor,
        onSelect: async () => {
          settings.sound = sound.id
          await persistSettings()
          soundCardsContainer.querySelectorAll('.sound-card').forEach((el) => {
            const elId = el.getAttribute('data-sound-id')
            updateSoundCardVisuals(el, elId === sound.id)
          })
        },
      })
      card.setAttribute('data-sound-card', 'true')
      card.setAttribute('data-sound-id', sound.id)
      soundCardsContainer.appendChild(card)
    }
  }

  const volumeSliderContainer = document.getElementById('volume-slider')
  if (volumeSliderContainer) {
    volumeSliderContainer.appendChild(
      createRangeSlider({
        label: 'Alert Volume',
        min: 0,
        max: 100,
        value: settings.volume,
        unit: '%',
        accentColor: '#516233',
        onChange: async (value) => {
          settings.volume = value
          await persistSettings()
        },
      })
    )
  }

  const togglesContainer = document.getElementById('preferences-toggles')
  if (togglesContainer) {
    togglesContainer.appendChild(
      createToggleSwitch({
        label: 'Auto-start Breaks',
        description: 'Automatically start break timers after work sessions',
        checked: settings.autoStartBreaks,
        onChange: async (checked) => {
          settings.autoStartBreaks = checked
          await persistSettings()
        },
      })
    )

    togglesContainer.appendChild(
      createToggleSwitch({
        label: 'Browser Notifications',
        description: 'Receive alerts when sessions complete',
        checked: settings.notifications,
        onChange: async (checked) => {
          settings.notifications = checked
          if (checked && 'Notification' in window && Notification.permission === 'default') {
            showToast('Sproutdoro will notify you when sessions complete — only on this device.', 'info')
            try {
              await Notification.requestPermission()
            } catch (err) {
              console.error('Notification permission error:', err)
            }
          }
          await persistSettings()
        },
      })
    )
  }

  const categoryContainer = document.getElementById('category-manager-container')
  if (categoryContainer) {
    const container = categoryContainer
    async function renderCategories() {
      const cats = await getCategories()
      container.innerHTML = ''
      const manager = createCategoryManager({
        categories: cats,
        onCategoryChange: renderCategories,
      })
      container.appendChild(manager)
    }
    renderCategories()
  }

  const backupContainer = document.getElementById('backup-restore')
  if (backupContainer) {
    const exportBtn = document.createElement('button')
    exportBtn.className =
      'px-5 py-2.5 rounded-2xl font-label text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all'
    exportBtn.textContent = 'Export Data'
    exportBtn.addEventListener('click', async () => {
      try {
        await exportAllData()
        showToast('Backup downloaded successfully.', 'success')
      } catch (err) {
        console.error('Export failed:', err)
        showToast('Export failed. Please try again.', 'error')
      }
    })

    const importLabel = document.createElement('label')
    importLabel.className =
      'px-5 py-2.5 rounded-2xl font-label text-sm font-semibold text-on-surface/70 hover:text-on-surface hover:bg-surface-container-high/50 transition-all cursor-pointer'
    importLabel.textContent = 'Import Data'

    const importInput = document.createElement('input')
    importInput.type = 'file'
    importInput.accept = 'application/json,.json'
    importInput.className = 'hidden'
    importInput.addEventListener('change', async () => {
      const file = importInput.files?.[0]
      if (!file) return
      showConfirmDialog({
        title: 'Replace all data?',
        message: 'Importing will replace all your sessions, plants, and settings. This cannot be undone.',
        confirmLabel: 'Import',
        destructive: true,
        onConfirm: async () => {
          try {
            await importAllData(file)
            showToast('Data restored successfully.', 'success')
            location.reload()
          } catch (err) {
            console.error('Import failed:', err)
            showToast(err instanceof Error ? err.message : 'Import failed. Invalid backup file.', 'error')
          }
        },
      })
      importInput.value = ''
    })
    importLabel.appendChild(importInput)

    backupContainer.appendChild(exportBtn)
    backupContainer.appendChild(importLabel)
  }

  const helpContainer = document.getElementById('help-about-content')
  if (helpContainer) {
    helpContainer.innerHTML = `
      <div class="flex flex-col gap-4 font-body text-sm text-on-surface/80">
        <div>
          <h3 class="font-headline font-bold text-on-surface mb-2">How it works</h3>
          <ul class="list-disc list-inside space-y-1 text-on-surface/70">
            <li>Plant a seed in your Garden</li>
            <li>Start a focus session on the Timer</li>
            <li>Complete sessions to grow your plant</li>
            <li>Track streaks and achievements in Insights</li>
          </ul>
        </div>
        <div>
          <h3 class="font-headline font-bold text-on-surface mb-2">Keyboard shortcuts (Focus page)</h3>
          <ul class="space-y-1 text-on-surface/70">
            <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-xs">Space</kbd> Start / pause</li>
            <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-xs">R</kbd> Reset timer</li>
            <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-xs">?</kbd> Show shortcuts</li>
          </ul>
        </div>
        <div class="flex flex-wrap gap-4 pt-2">
          <a href="${ISSUES_URL}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-label text-sm">Send feedback</a>
          <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-label text-sm">View source</a>
        </div>
      </div>
    `
  }

  const versionEl = document.getElementById('app-version')
  if (versionEl) versionEl.textContent = `Version ${__APP_VERSION__}`

  const resetBtn = document.getElementById('btn-reset')
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      showConfirmDialog({
        title: 'Reset all settings?',
        message: 'This will restore timer durations, theme, sounds, and preferences to defaults. Your garden data is not affected.',
        confirmLabel: 'Reset',
        destructive: true,
        onConfirm: async () => {
          settings = { ...DEFAULT_SETTINGS }
          await persistSettings()
          location.reload()
        },
      })
    })
  }

  injectSiteFooter()
}

bootstrapPage(initSettingsPage).catch(console.error)
