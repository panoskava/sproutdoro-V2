interface NotificationBannerProps {
  onPauseResume: () => void
  onImmediateBreak: () => void
  onSkip: () => void
}

export function createNotificationBanner(props: NotificationBannerProps): HTMLElement {
  const { onPauseResume, onImmediateBreak, onSkip } = props

  const container = document.createElement('div')
  container.id = 'persistent-notification-banner'
  container.className =
    'fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md glass-sage rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 transition-all duration-300 transform -translate-y-20 opacity-0 pointer-events-none'

  const infoWrap = document.createElement('div')
  infoWrap.className = 'flex items-center gap-3 min-w-0'

  const statusDot = document.createElement('div')
  statusDot.className = 'w-3 h-3 rounded-full bg-primary animate-pulse flex-shrink-0'

  const textWrap = document.createElement('div')
  textWrap.className = 'flex flex-col min-w-0'

  const titleEl = document.createElement('span')
  titleEl.className = 'font-headline text-xs font-bold text-on-surface truncate'
  titleEl.textContent = 'Focus Session Active'

  const timeEl = document.createElement('span')
  timeEl.className = 'font-label text-[11px] text-on-surface/70'
  timeEl.textContent = '25:00 remaining'

  textWrap.appendChild(titleEl)
  textWrap.appendChild(timeEl)
  infoWrap.appendChild(statusDot)
  infoWrap.appendChild(textWrap)

  const actionsWrap = document.createElement('div')
  actionsWrap.className = 'flex items-center gap-1.5 flex-shrink-0'

  const pauseBtn = document.createElement('button')
  pauseBtn.className =
    'px-3 py-1.5 rounded-xl bg-primary text-on-primary font-label text-xs font-semibold shadow-sm hover:opacity-90 transition-all flex items-center gap-1'
  pauseBtn.innerHTML = `
    <span class="material-symbols-outlined text-sm">pause</span>
    <span class="banner-pause-label">Pause</span>
  `
  pauseBtn.addEventListener('click', onPauseResume)

  const breakBtn = document.createElement('button')
  breakBtn.className =
    'px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface font-label text-xs font-semibold hover:bg-surface-container-highest transition-all flex items-center gap-1'
  breakBtn.innerHTML = `
    <span class="material-symbols-outlined text-sm">coffee</span>
    <span>Break</span>
  `
  breakBtn.addEventListener('click', onImmediateBreak)

  const skipBtn = document.createElement('button')
  skipBtn.className =
    'w-8 h-8 rounded-xl bg-surface-container-high text-on-surface/70 hover:text-on-surface flex items-center justify-center transition-all'
  skipBtn.innerHTML = `
    <span class="material-symbols-outlined text-sm">skip_next</span>
  `
  skipBtn.title = 'Skip Session'
  skipBtn.addEventListener('click', onSkip)

  actionsWrap.appendChild(pauseBtn)
  actionsWrap.appendChild(breakBtn)
  actionsWrap.appendChild(skipBtn)

  container.appendChild(infoWrap)
  container.appendChild(actionsWrap)

  return container
}

export function updateNotificationBanner(
  container: HTMLElement,
  state: {
    isRunning: boolean
    isPaused: boolean
    mode: 'work' | 'shortBreak' | 'longBreak'
    formattedTime: string
    intention?: string
  }
): void {
  const isVisible = state.isRunning || state.isPaused

  if (isVisible) {
    container.classList.remove('-translate-y-20', 'opacity-0', 'pointer-events-none')
    container.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto')
  } else {
    container.classList.add('-translate-y-20', 'opacity-0', 'pointer-events-none')
    container.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto')
    return
  }

  const titleEl = container.querySelector('.font-headline')
  const timeEl = container.querySelector('.font-label')
  const pauseLabel = container.querySelector('.banner-pause-label')
  const pauseIcon = container.querySelector('button .material-symbols-outlined')

  const modeText = state.mode === 'work' ? 'Focus Session' : state.mode === 'shortBreak' ? 'Short Break' : 'Long Break'
  if (titleEl) {
    titleEl.textContent = state.intention ? `Focus: ${state.intention}` : modeText
  }

  if (timeEl) {
    timeEl.textContent = `${state.formattedTime} remaining`
  }

  if (pauseLabel) {
    pauseLabel.textContent = state.isPaused ? 'Resume' : 'Pause'
  }

  if (pauseIcon) {
    pauseIcon.textContent = state.isPaused ? 'play_arrow' : 'pause'
  }
}
