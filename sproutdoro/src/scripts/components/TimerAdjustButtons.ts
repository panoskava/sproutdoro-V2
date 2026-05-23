interface TimerAdjustButtonsProps {
  onIncrement: () => void
  onDecrement: () => void
  adjustAmount: number
  isVisible: boolean
}

export function createTimerAdjustButtons(props: TimerAdjustButtonsProps): HTMLElement {
  const { onIncrement, onDecrement, adjustAmount, isVisible } = props

  const container = document.createElement('div')
  container.className = 'flex items-center gap-2 transition-all duration-300'
  container.style.opacity = isVisible ? '1' : '0'
  container.style.pointerEvents = isVisible ? 'auto' : 'none'
  container.id = 'timer-adjust-buttons'

  const label = `${adjustAmount}m`

  const decrementBtn = document.createElement('button')
  decrementBtn.className = 'w-10 h-10 md:w-12 md:h-12 rounded-full glass-sage flex items-center justify-center text-on-surface/60 hover:text-on-surface hover:bg-surface-container-high/50 transition-all duration-200'
  decrementBtn.title = `Subtract ${label}`
  decrementBtn.innerHTML = `<span class="material-symbols-outlined text-lg md:text-xl" style="font-variation-settings: 'FILL' 0, 'wght' 400;">remove</span>`
  decrementBtn.addEventListener('click', onDecrement)

  const amountLabel = document.createElement('span')
  amountLabel.className = 'font-label text-xs text-on-surface/50 select-none'
  amountLabel.textContent = label

  const incrementBtn = document.createElement('button')
  incrementBtn.className = 'w-10 h-10 md:w-12 md:h-12 rounded-full glass-sage flex items-center justify-center text-on-surface/60 hover:text-on-surface hover:bg-surface-container-high/50 transition-all duration-200'
  incrementBtn.title = `Add ${label}`
  incrementBtn.innerHTML = `<span class="material-symbols-outlined text-lg md:text-xl" style="font-variation-settings: 'FILL' 0, 'wght' 400;">add</span>`
  incrementBtn.addEventListener('click', onIncrement)

  container.appendChild(decrementBtn)
  container.appendChild(amountLabel)
  container.appendChild(incrementBtn)

  return container
}

export function updateTimerAdjustButtonsVisibility(visible: boolean): void {
  const container = document.getElementById('timer-adjust-buttons')
  if (container) {
    container.style.opacity = visible ? '1' : '0'
    container.style.pointerEvents = visible ? 'auto' : 'none'
  }
}