export interface PlantGrowthRingProps {
  size: number
  progress: number
}

const EMOJI_STAGES = [
  { emoji: '🌱', scale: 0.85, opacity: 0.7 },
  { emoji: '🌱', scale: 1.0, opacity: 0.9 },
  { emoji: '🌿', scale: 1.15, opacity: 1.0 },
  { emoji: '🌿', scale: 1.25, opacity: 1.0 },
  { emoji: '🌻', scale: 1.4, opacity: 1.0 },
]

const RING_COLORS = ['#516233', '#516233', '#bbce95', '#d6eaaf', '#ffdbce']
const RING_STROKE_WIDTH_BASE = [2, 2, 3, 3, 4]
const MILESTONES = [0, 0.25, 0.5, 0.75, 1.0]

function getMilestoneIndex(progress: number): number {
  let idx = 0
  for (let i = 1; i < MILESTONES.length; i++) {
    if (progress >= MILESTONES[i]) idx = i
  }
  return idx
}

export function createPlantGrowthRing(props: PlantGrowthRingProps): SVGSVGElement {
  const { size } = props
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', `${size}`)
  svg.setAttribute('height', `${size}`)
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`)
  svg.classList.add('plant-growth-svg')
  svg.style.position = 'absolute'
  svg.style.top = '0'
  svg.style.left = '0'
  svg.style.width = '100%'
  svg.style.height = '100%'
  svg.style.zIndex = '1'

  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', 'Plant growth stage: seedling')

  ;(svg as any).__milestoneIndex = 0

  updatePlantGrowthRing(svg, props)

  return svg
}

export function updatePlantGrowthRing(
  svg: SVGSVGElement,
  props: PlantGrowthRingProps
): void {
  const { size, progress } = props
  const center = size / 2
  const maxRadius = size * 0.38
  const minRadius = size * 0.12
  const ringGap = (maxRadius - minRadius) / (RING_COLORS.length - 1)

  const newMilestone = getMilestoneIndex(progress)
  const currentMilestone: number = (svg as any).__milestoneIndex ?? 0

  for (let i = 0; i <= newMilestone; i++) {
    let ring = svg.querySelector(`circle[data-ring-index="${i}"]`) as SVGCircleElement | null
    const radius = minRadius + i * ringGap
    const isNew = i > currentMilestone

    if (!ring) {
      ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      ring.setAttribute('data-ring-index', `${i}`)
      ring.setAttribute('cx', `${center}`)
      ring.setAttribute('cy', `${center}`)
      ring.setAttribute('r', `${radius}`)
      ring.setAttribute('fill', 'none')
      ring.setAttribute('stroke', RING_COLORS[i])
      ring.setAttribute('stroke-width', `${RING_STROKE_WIDTH_BASE[i]}`)
      ring.setAttribute('stroke-linecap', 'round')
      ring.style.opacity = isNew ? '0' : `${EMOJI_STAGES[i].opacity}`
      ring.style.transition = 'opacity 400ms ease-out, stroke-width 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
      svg.appendChild(ring)

      if (isNew) {
        requestAnimationFrame(() => {
          ring!.style.opacity = `${EMOJI_STAGES[i].opacity}`
          ring!.setAttribute('stroke-width', `${RING_STROKE_WIDTH_BASE[i]}`)
        })
      }
    } else {
      ring.style.opacity = `${EMOJI_STAGES[i].opacity}`
      ring.setAttribute('stroke-width', `${RING_STROKE_WIDTH_BASE[i]}`)
    }
  }

  // Update emoji stage
  let emojiEl = svg.parentElement?.querySelector('.plant-growth-emoji') as HTMLElement | null
  if (emojiEl) {
    const stage = EMOJI_STAGES[newMilestone]
    emojiEl.textContent = stage.emoji
    emojiEl.style.transform = `translate(-50%, -50%) scale(${stage.scale})`
    emojiEl.style.opacity = `${stage.opacity}`
    emojiEl.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-out'
  }

  ;(svg as any).__milestoneIndex = newMilestone

  const stageLabels = ['seedling', 'sprout', 'growing', 'thriving', 'blooming']
  svg.setAttribute('aria-label', `Plant growth stage: ${stageLabels[newMilestone]}`)
}

export function createGrowthEmojiElement(size: number): HTMLElement {
  const el = document.createElement('span')
  el.className = 'plant-growth-emoji animate-bounce-subtle'
  el.style.position = 'absolute'
  el.style.top = '50%'
  el.style.left = '50%'
  el.style.transform = 'translate(-50%, -50%) scale(0.85)'
  el.style.fontSize = `${Math.round(size * 0.18)}px`
  el.style.opacity = '0.7'
  el.style.zIndex = '2'
  el.style.pointerEvents = 'none'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.textContent = '🌱'
  return el
}
