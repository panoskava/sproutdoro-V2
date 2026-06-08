import { setupModal } from '../utils/modal'

export interface ConfirmDialogOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

export function showConfirmDialog(options: ConfirmDialogOptions): void {
  const existing = document.getElementById('confirm-dialog')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.id = 'confirm-dialog'
  overlay.className =
    'fixed inset-0 z-[70] flex items-center justify-center bg-background/90 backdrop-blur-md'

  const card = document.createElement('div')
  card.className = 'stat-card-glass rounded-3xl p-6 max-w-md w-full mx-4 flex flex-col gap-4'
  card.setAttribute('role', 'alertdialog')
  card.setAttribute('aria-labelledby', 'confirm-dialog-title')
  card.setAttribute('aria-describedby', 'confirm-dialog-message')

  const title = document.createElement('h2')
  title.id = 'confirm-dialog-title'
  title.className = 'font-headline text-lg font-bold text-on-surface'
  title.textContent = options.title

  const message = document.createElement('p')
  message.id = 'confirm-dialog-message'
  message.className = 'font-body text-sm text-on-surface/70'
  message.textContent = options.message

  const btnRow = document.createElement('div')
  btnRow.className = 'flex items-center gap-3 justify-end'

  function close() {
    cleanup()
    overlay.remove()
  }

  const cancelBtn = document.createElement('button')
  cancelBtn.className =
    'px-4 py-2 rounded-xl font-label text-sm font-semibold text-on-surface/60 hover:text-on-surface transition-all'
  cancelBtn.textContent = options.cancelLabel ?? 'Cancel'
  cancelBtn.addEventListener('click', () => {
    options.onCancel?.()
    close()
  })

  const confirmBtn = document.createElement('button')
  confirmBtn.className = options.destructive
    ? 'px-6 py-2.5 rounded-2xl bg-error text-on-error font-label text-sm font-semibold shadow-lg hover:opacity-90 transition-all'
    : 'px-6 py-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-label text-sm font-semibold shadow-lg hover:-translate-y-0.5 transition-all'
  confirmBtn.textContent = options.confirmLabel ?? 'Confirm'
  confirmBtn.addEventListener('click', async () => {
    await options.onConfirm()
    close()
  })

  btnRow.appendChild(cancelBtn)
  btnRow.appendChild(confirmBtn)
  card.appendChild(title)
  card.appendChild(message)
  card.appendChild(btnRow)
  overlay.appendChild(card)
  document.body.appendChild(overlay)

  const cleanup = setupModal(overlay, card, {
    onEscape: () => {
      options.onCancel?.()
      close()
    },
    initialFocus: cancelBtn,
  })
}
