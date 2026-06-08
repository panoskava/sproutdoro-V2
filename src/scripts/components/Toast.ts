export type ToastVariant = 'error' | 'success' | 'info'

let container: HTMLElement | null = null

function getContainer(): HTMLElement {
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    container.className = 'fixed bottom-24 md:bottom-8 right-4 z-[100] flex flex-col gap-2 pointer-events-none'
    document.body.appendChild(container)
  }
  return container
}

export function showToast(message: string, variant: ToastVariant = 'info'): void {
  const toast = document.createElement('div')
  toast.setAttribute('role', variant === 'error' ? 'alert' : 'status')
  toast.setAttribute('aria-live', variant === 'error' ? 'assertive' : 'polite')

  const colors: Record<ToastVariant, string> = {
    error: 'bg-error/90 text-on-error border-error',
    success: 'bg-primary text-on-primary border-primary',
    info: 'bg-surface-container-high text-on-surface border-outline-variant/30',
  }

  toast.className = `pointer-events-auto px-4 py-3 rounded-xl shadow-lg border font-label text-sm max-w-sm animate-fade-in ${colors[variant]}`
  toast.textContent = message

  getContainer().appendChild(toast)

  window.setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transition = 'opacity 0.3s'
    window.setTimeout(() => toast.remove(), 300)
  }, 5000)
}
