const DISMISS_KEY = 'sproutdoro_install_dismissed'
const SESSION_COMPLETE_KEY = 'sproutdoro_first_session_complete'

let deferredPrompt: BeforeInstallPromptEvent | null = null

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function markFirstSessionComplete(): void {
  localStorage.setItem(SESSION_COMPLETE_KEY, '1')
  maybeShowInstallBanner()
}

export function initInstallBanner(): void {
  if (isStandalone()) return

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    maybeShowInstallBanner()
  })
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isDismissed(): boolean {
  return localStorage.getItem(DISMISS_KEY) === '1'
}

function hasCompletedSession(): boolean {
  return localStorage.getItem(SESSION_COMPLETE_KEY) === '1'
}

function maybeShowInstallBanner(): void {
  if (isStandalone() || isDismissed() || !hasCompletedSession() || !deferredPrompt) return
  if (document.getElementById('install-banner')) return

  const banner = document.createElement('div')
  banner.id = 'install-banner'
  banner.className =
    'fixed bottom-28 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40 stat-card-glass rounded-2xl p-4 flex flex-col gap-3 shadow-lg'
  banner.setAttribute('role', 'region')
  banner.setAttribute('aria-label', 'Install app')

  const text = document.createElement('p')
  text.className = 'font-body text-sm text-on-surface/80'
  text.textContent = 'Install Sproutdoro for offline access and a home-screen shortcut'

  const btnRow = document.createElement('div')
  btnRow.className = 'flex items-center gap-2'

  const installBtn = document.createElement('button')
  installBtn.className =
    'flex-1 px-4 py-2 rounded-xl bg-primary text-on-primary font-label text-sm font-semibold'
  installBtn.textContent = 'Install'
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    deferredPrompt = null
    banner.remove()
  })

  const dismissBtn = document.createElement('button')
  dismissBtn.className = 'px-4 py-2 rounded-xl font-label text-sm text-on-surface/60 hover:text-on-surface'
  dismissBtn.textContent = 'Not now'
  dismissBtn.addEventListener('click', () => {
    localStorage.setItem(DISMISS_KEY, '1')
    banner.remove()
  })

  btnRow.appendChild(installBtn)
  btnRow.appendChild(dismissBtn)
  banner.appendChild(text)
  banner.appendChild(btnRow)
  document.body.appendChild(banner)
}
