interface TimerAdjustButtonsProps {
  onIncrement: () => void
  onDecrement: () => void
  adjustAmount: number
  isVisible: boolean
}

export function createTimerAdjustButtons(props: TimerAdjustButtonsProps): HTMLElement {
  const { onIncrement, onDecrement, adjustAmount, isVisible } = props

  const container = document.createElement('div')
  container.className = 'flex items-center gap-3 transition-all duration-300'
  container.style.opacity = isVisible ? '1' : '0'
  container.style.pointerEvents = isVisible ? 'auto' : 'none'
  container.id = 'timer-adjust-buttons'

  const decrementBtn = document.createElement('button')
  decrementBtn.className = 'px-3.5 py-1.5 rounded-full glass-sage flex items-center gap-1 text-on-surface/80 hover:text-on-surface hover:bg-surface-container-high/60 font-label text-xs font-semibold transition-all duration-200 shadow-sm'
  decrementBtn.title = `Subtract ${adjustAmount} minutes`
  decrementBtn.innerHTML = `
    <span class="material-symbols-outlined text-sm">remove</span>
    <span>-${adjustAmount}m</span>
  `
  decrementBtn.addEventListener('click', onDecrement)

  const incrementBtn = document.createElement('button')
  incrementBtn.className = 'px-3.5 py-1.5 rounded-full glass-sage flex items-center gap-1 text-on-surface/80 hover:text-on-surface hover:bg-surface-container-high/60 font-label text-xs font-semibold transition-all duration-200 shadow-sm'
  incrementBtn.title = `Add ${adjustAmount} minutes`
  incrementBtn.innerHTML = `
    <span class="material-symbols-outlined text-sm">add</span>
    <span>+${adjustAmount}m</span>
  `
  incrementBtn.addEventListener('click', onIncrement)

  container.appendChild(decrementBtn)
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