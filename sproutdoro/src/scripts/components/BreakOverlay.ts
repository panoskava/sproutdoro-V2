interface BreakOverlayProps {
  breakDuration: number
  onBreakComplete: () => void
  onCancelBreak: () => void
}

export function createBreakOverlay(props: BreakOverlayProps): HTMLElement {
  const { breakDuration, onBreakComplete, onCancelBreak } = props

  const overlay = document.createElement('div')
  overlay.id = 'break-overlay'
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md transition-all duration-500'
  overlay.style.opacity = '0'
  overlay.style.pointerEvents = 'none'

  const card = document.createElement('div')
  card.className = 'stat-card-glass rounded-3xl p-8 md:p-12 flex flex-col items-center gap-6 max-w-sm mx-4'

  const icon = document.createElement('span')
  icon.className = 'material-symbols-outlined text-5xl text-primary'
  icon.style.fontVariationSettings = "'FILL' 1, 'wght' 600"
  icon.textContent = 'coffee'

  const title = document.createElement('h2')
  title.className = 'font-headline text-2xl font-bold text-on-surface'
  title.textContent = 'Taking a Break'

  const subtitle = document.createElement('p')
  subtitle.className = 'font-body text-sm text-on-surface/60 text-center'
  subtitle.textContent = 'Your focus session will resume automatically when the break ends.'

  const timerDisplay = document.createElement('div')
  timerDisplay.className = 'flex items-baseline gap-1'
  const minsEl = document.createElement('span')
  minsEl.id = 'break-time-mins'
  minsEl.className = 'font-headline text-6xl font-bold text-on-surface'
  const colonEl = document.createElement('span')
  colonEl.className = 'font-headline text-6xl font-bold text-primary/70'
  colonEl.textContent = ':'
  const secsEl = document.createElement('span')
  secsEl.id = 'break-time-secs'
  secsEl.className = 'font-headline text-6xl font-bold text-on-surface'
  timerDisplay.appendChild(minsEl)
  timerDisplay.appendChild(colonEl)
  timerDisplay.appendChild(secsEl)

  const progressWrap = document.createElement('div')
  progressWrap.className = 'w-full h-2 bg-surface-container-high rounded-full overflow-hidden'
  const progressBar = document.createElement('div')
  progressBar.id = 'break-progress'
  progressBar.className = 'h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-1000'
  progressBar.style.width = '0%'
  progressWrap.appendChild(progressBar)

  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'px-6 py-3 rounded-2xl font-label text-sm font-semibold text-on-surface/70 hover:text-on-surface bg-surface-container-high/50 hover:bg-surface-container-high transition-all duration-200'
  cancelBtn.textContent = 'End Break Early'
  cancelBtn.addEventListener('click', onCancelBreak)

  card.appendChild(icon)
  card.appendChild(title)
  card.appendChild(subtitle)
  card.appendChild(timerDisplay)
  card.appendChild(progressWrap)
  card.appendChild(cancelBtn)
  overlay.appendChild(card)

  return overlay
}

export function showBreakOverlay(): void {
  const overlay = document.getElementById('break-overlay')
  if (overlay) {
    overlay.style.opacity = '1'
    overlay.style.pointerEvents = 'auto'
  }
}

export function hideBreakOverlay(): void {
  const overlay = document.getElementById('break-overlay')
  if (overlay) {
    overlay.style.opacity = '0'
    overlay.style.pointerEvents = 'none'
  }
}

export function updateBreakOverlay(remainingSeconds: number, totalSeconds: number): void {
  const minsEl = document.getElementById('break-time-mins')
  const secsEl = document.getElementById('break-time-secs')
  const progressEl = document.getElementById('break-progress')
  if (minsEl) minsEl.textContent = String(Math.floor(remainingSeconds / 60)).padStart(2, '0')
  if (secsEl) secsEl.textContent = String(remainingSeconds % 60).padStart(2, '0')
  if (progressEl && totalSeconds > 0) {
    const pct = Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100)
    progressEl.style.width = `${pct}%`
  }
}