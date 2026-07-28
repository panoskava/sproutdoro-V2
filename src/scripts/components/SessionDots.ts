export function createSessionDots(sessionCount: number, totalDots = 5): HTMLElement {
  const container = document.createElement('div')
  container.className = 'flex items-center justify-center gap-1.5'
  container.setAttribute('aria-label', `Session ${sessionCount % totalDots} of ${totalDots}`)

  const activeIndex = sessionCount % totalDots

  for (let i = 0; i < totalDots; i++) {
    const dot = document.createElement('div')
    const isActive = i === activeIndex
    const isCompleted = i < activeIndex
    dot.className = `w-2 h-2 rounded-full transition-all duration-300 ${
      isActive
        ? 'bg-primary scale-125'
        : isCompleted
          ? 'bg-primary/50'
          : 'bg-on-surface/20'
    }`
    container.appendChild(dot)
  }

  return container
}

export function updateSessionDots(container: HTMLElement, sessionCount: number, totalDots = 5): void {
  container.setAttribute('aria-label', `Session ${sessionCount % totalDots} of ${totalDots}`)
  const activeIndex = sessionCount % totalDots
  const dots = container.children

  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i] as HTMLElement
    const isActive = i === activeIndex
    const isCompleted = i < activeIndex
    dot.className = `w-2 h-2 rounded-full transition-all duration-300 ${
      isActive
        ? 'bg-primary scale-125'
        : isCompleted
          ? 'bg-primary/50'
          : 'bg-on-surface/20'
    }`
  }
}
