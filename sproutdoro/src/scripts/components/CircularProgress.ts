interface CircularProgressProps {
  size: number
  strokeWidth: number
  progress: number // 0-1
  color?: string
  trackColor?: string
  showSunDot?: boolean
  sunDotColor?: string
}

export function createCircularProgress(props: CircularProgressProps): SVGSVGElement {
  const {
    size,
    strokeWidth,
    progress,
    color = '#516233',
    trackColor = 'rgba(81, 98, 51, 0.1)',
    showSunDot = true,
    sunDotColor = '#fd9e77',
  } = props

  const center = size / 2
  const radius = Math.max(1, (size - strokeWidth) / 2)
  const circumference = 2 * Math.PI * radius
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const dashoffset = circumference * (1 - clampedProgress)

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', `${size}`)
  svg.setAttribute('height', `${size}`)
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`)
  svg.classList.add('timer-svg')
  svg.style.transform = 'rotate(-90deg)'

  // Background track circle (thin, muted)
  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  track.setAttribute('cx', `${center}`)
  track.setAttribute('cy', `${center}`)
  track.setAttribute('r', `${radius}`)
  track.setAttribute('fill', 'none')
  track.setAttribute('stroke', trackColor)
  track.setAttribute('stroke-width', `${strokeWidth * 0.4}`)
  track.setAttribute('stroke-linecap', 'round')
  track.setAttribute('data-role', 'track')
  svg.appendChild(track)

  // Progress track circle (thick, subtle fill)
  const progressTrack = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  progressTrack.setAttribute('cx', `${center}`)
  progressTrack.setAttribute('cy', `${center}`)
  progressTrack.setAttribute('r', `${radius}`)
  progressTrack.setAttribute('fill', 'none')
  progressTrack.setAttribute('stroke', color)
  progressTrack.setAttribute('stroke-width', `${strokeWidth}`)
  progressTrack.setAttribute('stroke-linecap', 'round')
  progressTrack.setAttribute('stroke-opacity', '0.12')
  progressTrack.setAttribute('data-role', 'progress-track')
  svg.appendChild(progressTrack)

  // Active arc (thick, animated)
  const activeArc = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  activeArc.setAttribute('cx', `${center}`)
  activeArc.setAttribute('cy', `${center}`)
  activeArc.setAttribute('r', `${radius}`)
  activeArc.setAttribute('fill', 'none')
  activeArc.setAttribute('stroke', color)
  activeArc.setAttribute('stroke-width', `${strokeWidth}`)
  activeArc.setAttribute('stroke-linecap', 'round')
  activeArc.setAttribute('stroke-dasharray', `${circumference}`)
  activeArc.setAttribute('stroke-dashoffset', `${dashoffset}`)
  activeArc.setAttribute('data-role', 'active-arc')
  activeArc.style.transition = 'stroke-dashoffset 0.5s ease-out'
  svg.appendChild(activeArc)

  if (showSunDot) {
    // Calculate sun position
    const angle = clampedProgress * 2 * Math.PI
    const sunX = center + radius * Math.cos(angle)
    const sunY = center + radius * Math.sin(angle)

    // Outer sun dot
    const sunDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    sunDot.setAttribute('cx', `${sunX}`)
    sunDot.setAttribute('cy', `${sunY}`)
    sunDot.setAttribute('r', `${strokeWidth * 0.8}`)
    sunDot.setAttribute('fill', sunDotColor)
    sunDot.setAttribute('data-role', 'sun-dot')
    sunDot.style.transition = 'cx 0.5s ease-out, cy 0.5s ease-out'
    svg.appendChild(sunDot)

    // Inner dot at sun position
    const innerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    innerDot.setAttribute('cx', `${sunX}`)
    innerDot.setAttribute('cy', `${sunY}`)
    innerDot.setAttribute('r', `${strokeWidth * 0.3}`)
    innerDot.setAttribute('fill', '#ffffff')
    innerDot.setAttribute('data-role', 'inner-dot')
    innerDot.style.transition = 'cx 0.5s ease-out, cy 0.5s ease-out'
    svg.appendChild(innerDot)
  }

  return svg
}

export function updateCircularProgress(
  svg: SVGSVGElement,
  progress: number,
  props: Pick<CircularProgressProps, 'size' | 'strokeWidth'>
): void {
  const { size, strokeWidth } = props
  const center = size / 2
  const radius = Math.max(1, (size - strokeWidth) / 2)
  const circumference = 2 * Math.PI * radius
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const dashoffset = circumference * (1 - clampedProgress)

  const activeArc = svg.querySelector('circle[data-role="active-arc"]') as SVGCircleElement
  if (activeArc) {
    activeArc.setAttribute('stroke-dashoffset', `${dashoffset}`)
  }

  // Update sun dots positions if they exist
  const sunDots = svg.querySelectorAll('circle[data-role="sun-dot"], circle[data-role="inner-dot"]')
  if (sunDots.length >= 2) {
    const angle = clampedProgress * 2 * Math.PI
    const sunX = center + radius * Math.cos(angle)
    const sunY = center + radius * Math.sin(angle)

    sunDots.forEach((dot) => {
      dot.setAttribute('cx', `${sunX}`)
      dot.setAttribute('cy', `${sunY}`)
    })
  }
}
