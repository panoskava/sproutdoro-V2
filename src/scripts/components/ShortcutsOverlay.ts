import { setupModal } from '../utils/modal'

const SHORTCUTS = [
  { key: 'Space', action: 'Start / pause timer' },
  { key: 'R', action: 'Reset timer' },
  { key: '?', action: 'Show / hide this help' },
  { key: 'Escape', action: 'Close dialogs' },
]

let isOpen = false
let cleanupFn: (() => void) | null = null

export function toggleShortcutsOverlay(): void {
  if (isOpen) {
    closeShortcutsOverlay()
  } else {
    openShortcutsOverlay()
  }
}

export function openShortcutsOverlay(): void {
  if (isOpen) return
  isOpen = true

  const overlay = document.createElement('div')
  overlay.id = 'shortcuts-overlay'
  overlay.className =
    'fixed inset-0 z-[70] flex items-center justify-center bg-background/90 backdrop-blur-md'

  const card = document.createElement('div')
  card.className = 'stat-card-glass rounded-3xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4'

  const title = document.createElement('h2')
  title.className = 'font-headline text-lg font-bold text-on-surface'
  title.textContent = 'Keyboard Shortcuts'

  const list = document.createElement('div')
  list.className = 'flex flex-col gap-2'

  for (const { key, action } of SHORTCUTS) {
    const row = document.createElement('div')
    row.className = 'flex items-center justify-between gap-4'

    const kbd = document.createElement('kbd')
    kbd.className =
      'px-2 py-1 rounded-lg bg-surface-container-high font-label text-xs font-semibold text-on-surface'
    kbd.textContent = key

    const desc = document.createElement('span')
    desc.className = 'font-body text-sm text-on-surface/70'
    desc.textContent = action

    row.appendChild(kbd)
    row.appendChild(desc)
    list.appendChild(row)
  }

  const closeBtn = document.createElement('button')
  closeBtn.className =
    'self-end px-4 py-2 rounded-xl font-label text-sm font-semibold text-on-surface/60 hover:text-on-surface'
  closeBtn.textContent = 'Close'
  closeBtn.addEventListener('click', closeShortcutsOverlay)

  card.appendChild(title)
  card.appendChild(list)
  card.appendChild(closeBtn)
  overlay.appendChild(card)
  document.body.appendChild(overlay)

  cleanupFn = setupModal(overlay, card, {
    onEscape: closeShortcutsOverlay,
    initialFocus: closeBtn,
  })
}

export function closeShortcutsOverlay(): void {
  const overlay = document.getElementById('shortcuts-overlay')
  if (overlay) overlay.remove()
  cleanupFn?.()
  cleanupFn = null
  isOpen = false
}

export function createShortcutsButton(): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.id = 'btn-shortcuts-help'
  btn.className =
    'w-10 h-10 rounded-full glass-sage flex items-center justify-center text-on-surface/60 hover:text-on-surface transition-all'
  btn.title = 'Keyboard shortcuts (?)'
  btn.setAttribute('aria-label', 'Keyboard shortcuts')
  btn.innerHTML =
    '<span class="font-label text-lg font-bold">?</span>'
  btn.addEventListener('click', toggleShortcutsOverlay)
  return btn
}
