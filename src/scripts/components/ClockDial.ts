interface ClockDialProps {
  size: number
  progress: number // 0 to 1
  accentColor?: string
}

export function createClockDial(props: ClockDialProps): SVGSVGElement {
  const { size, progress, accentColor = '#516233' } = props

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 300 300')
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size))
  svg.className.baseVal = 'clock-dial-svg select-none overflow-visible'

  const center = 150
  const outerRadius = 135

  // 1. Tick marks group
  const tickGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  tickGroup.setAttribute('class', 'clock-ticks')

  for (let i = 0; i < 60; i++) {
    const angle = (i * 6) * (Math.PI / 180)
    const isMajor = i % 5 === 0
    const tickLen = isMajor ? 12 : 6
    const strokeWidth = isMajor ? 2 : 1

    const x1 = center + Math.sin(angle) * (outerRadius - tickLen)
    const y1 = center - Math.cos(angle) * (outerRadius - tickLen)
    const x2 = center + Math.sin(angle) * outerRadius
    const y2 = center - Math.cos(angle) * outerRadius

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', String(x1))
    line.setAttribute('y1', String(y1))
    line.setAttribute('x2', String(x2))
    line.setAttribute('y2', String(y2))
    line.setAttribute('stroke', 'var(--color-outline-variant)')
    line.setAttribute('stroke-width', String(strokeWidth))
    line.setAttribute('stroke-linecap', 'round')
    tickGroup.appendChild(line)
  }
  svg.appendChild(tickGroup)

  // 2. Pie wedge group
  const wedgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  const wedgePath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  wedgePath.setAttribute('class', 'clock-wedge')
  wedgePath.setAttribute('fill', accentColor)
  wedgePath.setAttribute('fill-opacity', '0.25')
  wedgeGroup.appendChild(wedgePath)

  svg.appendChild(wedgeGroup)

  // 3. Hand pointer
  const handLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  handLine.setAttribute('class', 'clock-hand')
  handLine.setAttribute('stroke', accentColor)
  handLine.setAttribute('stroke-width', '4')
  handLine.setAttribute('stroke-linecap', 'round')
  svg.appendChild(handLine)

  // 4. Center pin dot
  const centerPin = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  centerPin.setAttribute('cx', String(center))
  centerPin.setAttribute('cy', String(center))
  centerPin.setAttribute('r', '10')
  centerPin.setAttribute('fill', 'var(--color-surface)')
  centerPin.setAttribute('stroke', accentColor)
  centerPin.setAttribute('stroke-width', '4')
  centerPin.setAttribute('class', 'shadow-sm')
  svg.appendChild(centerPin)

  updateClockDial(svg, progress, accentColor)
  return svg
}

export function updateClockDial(
  svg: SVGSVGElement,
  progress: number,
  accentColor = '#516233'
): void {
  const center = 150
  const radius = 90
  const clampedProgress = Math.max(0, Math.min(1, progress))

  const wedgePath = svg.querySelector('.clock-wedge') as SVGPathElement | null
  const handLine = svg.querySelector('.clock-hand') as SVGLineElement | null

  // Calculate angle in radians (starting from top = -90deg or 0rad when using sin/cos with 12 o'clock)
  const angleRad = clampedProgress * 2 * Math.PI

  if (wedgePath) {
    if (clampedProgress <= 0) {
      wedgePath.setAttribute('d', '')
    } else if (clampedProgress >= 0.999) {
      wedgePath.setAttribute('d', `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius} Z`)
    } else {
      const endX = center + Math.sin(angleRad) * radius
      const endY = center - Math.cos(angleRad) * radius
      const largeArc = angleRad > Math.PI ? 1 : 0
      const d = `M ${center} ${center} L ${center} ${center - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`
      wedgePath.setAttribute('d', d)
    }
    wedgePath.setAttribute('fill', accentColor)
  }

  if (handLine) {
    const handLength = radius + 15
    const handX = center + Math.sin(angleRad) * handLength
    const handY = center - Math.cos(angleRad) * handLength
    handLine.setAttribute('x1', String(center))
    handLine.setAttribute('y1', String(center))
    handLine.setAttribute('x2', String(handX))
    handLine.setAttribute('y2', String(handY))
    handLine.setAttribute('stroke', accentColor)
  }
}
