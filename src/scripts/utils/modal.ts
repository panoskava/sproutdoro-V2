export interface ModalOptions {
  onEscape?: () => void
  initialFocus?: HTMLElement
}

export function trapFocus(container: HTMLElement): () => void {
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const elements = Array.from(focusable).filter((el) => !el.hasAttribute('disabled'))

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab' || elements.length === 0) return
    const first = elements[0]
    const last = elements[elements.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  container.addEventListener('keydown', handleKeyDown)
  return () => container.removeEventListener('keydown', handleKeyDown)
}

export function setupModal(
  overlay: HTMLElement,
  dialog: HTMLElement,
  options: ModalOptions = {}
): () => void {
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')

  const cleanups: Array<() => void> = []
  cleanups.push(trapFocus(dialog))

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && options.onEscape) {
      e.preventDefault()
      options.onEscape()
    }
  }
  overlay.addEventListener('keydown', handleKeyDown)
  cleanups.push(() => overlay.removeEventListener('keydown', handleKeyDown))

  const focusTarget = options.initialFocus ?? dialog.querySelector<HTMLElement>('button, input, [href]')
  requestAnimationFrame(() => focusTarget?.focus())

  return () => {
    for (const cleanup of cleanups) cleanup()
  }
}
