import '../styles/main.css'
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { createRangeSlider } from './components/RangeSlider'
import { createToggleSwitch } from './components/ToggleSwitch'
import { createSoundCard } from './components/SoundCard'
import { getSettings, saveSettings, DEFAULT_SETTINGS } from './storage'
import type { Settings } from '../types'
import { applyTheme, setTheme } from './theme'

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
  let settings: Settings
  try {
    settings = await getSettings()
  } catch (err) {
    console.error('Failed to load settings:', err)
    alert('Unable to load settings. Please try refreshing the page.')
    return
  }

  applyTheme()

  // Render navs
  const sideNavContainer = document.getElementById('side-nav')
  if (sideNavContainer) {
    sideNavContainer.appendChild(createSideNav('config'))
  }

  const mobileNavContainer = document.getElementById('mobile-nav')
  if (mobileNavContainer) {
    mobileNavContainer.appendChild(createMobileNav('config'))
  }

  // Helper to save settings
  async function persistSettings() {
    try {
      await saveSettings(settings)
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  // Timer Durations
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

  // Appearance
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

  // Ambience & Alerts
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

  // Preferences / Toggles
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
          await persistSettings()
        },
      })
    )
  }

  // Reset Defaults
  const resetBtn = document.getElementById('btn-reset')
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        settings = { ...DEFAULT_SETTINGS }
        await persistSettings()
        location.reload()
      }
    })
  }

  // Save Changes
  const saveBtn = document.getElementById('btn-save')
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      await persistSettings()
      const originalText = saveBtn.textContent
      saveBtn.textContent = 'Saved!'
      saveBtn.classList.add('opacity-80')
      setTimeout(() => {
        saveBtn.textContent = originalText
        saveBtn.classList.remove('opacity-80')
      }, 2000)
    })
  }
}

initSettingsPage().catch(console.error)
