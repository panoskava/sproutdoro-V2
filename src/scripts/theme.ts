import { getSettings } from './storage'

export async function applyTheme(): Promise<void> {
  try {
    const settings = await getSettings()
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  } catch {
    document.documentElement.classList.remove('dark')
  }
}

export function setTheme(theme: 'light' | 'dark'): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}