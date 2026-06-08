import { initDB } from './storage'
import { showToast } from './components/Toast'

export function showLoadingOverlay(): void {
  let overlay = document.getElementById('loading-overlay')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'loading-overlay'
    overlay.className =
      'fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur-sm'
    overlay.innerHTML = `
      <span class="text-5xl animate-pulse" aria-hidden="true">🌱</span>
      <span class="font-label text-sm text-on-surface/60">Loading your garden...</span>
    `
    document.body.prepend(overlay)
  }
  overlay.style.display = 'flex'
}

export function hideLoadingOverlay(): void {
  const overlay = document.getElementById('loading-overlay')
  if (overlay) overlay.style.display = 'none'
}

export async function bootstrapPage(initFn: () => Promise<void>): Promise<void> {
  showLoadingOverlay()
  try {
    await initDB()
    hideLoadingOverlay()
    const content = document.getElementById('app-content')
    if (content) content.classList.remove('invisible')
    await initFn()
  } catch (err) {
    hideLoadingOverlay()
    console.error('Bootstrap failed:', err)
    showToast('Failed to load app data. Please refresh the page.', 'error')
  }
}
