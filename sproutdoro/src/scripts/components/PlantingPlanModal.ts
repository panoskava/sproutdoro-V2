import { PLANT_DEFINITIONS, RARITY_ORDER, type PlantDefinition } from '../plant-definitions'
import type { Plant } from '../../types'

interface PlantingPlanModalProps {
  existingPlants: Plant[]
  activePlant?: Plant
  onSelect: (definition: PlantDefinition) => void
  onClose: () => void
}

const RARITY_BADGE_CLASSES: Record<string, string> = {
  common: 'bg-primary/10 text-primary',
  uncommon: 'bg-secondary/10 text-secondary',
  rare: 'bg-tertiary/10 text-tertiary',
  legendary: 'bg-secondary-fixed/30 text-on-secondary-fixed-variant',
}

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
}

export function createPlantingPlanModal(props: PlantingPlanModalProps): HTMLElement {
  const { existingPlants, onSelect, onClose } = props

  const overlay = document.createElement('div')
  overlay.id = 'planting-plan-modal'
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md transition-all duration-300'
  overlay.style.opacity = '0'
  requestAnimationFrame(() => { overlay.style.opacity = '1' })

  const modal = document.createElement('div')
  modal.className = 'stat-card-glass rounded-3xl p-6 md:p-8 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col gap-4 overflow-hidden'

  const header = document.createElement('div')
  header.className = 'flex items-center justify-between'

  const title = document.createElement('h2')
  title.className = 'font-headline text-xl font-bold text-on-surface'
  title.textContent = 'Choose a Plant'

  const closeBtn = document.createElement('button')
  closeBtn.className = 'w-8 h-8 rounded-full flex items-center justify-center text-on-surface/50 hover:text-on-surface hover:bg-surface-container-high/50 transition-all duration-200'
  closeBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 0, \'wght\' 400;">close</span>'
  closeBtn.addEventListener('click', onClose)

  header.appendChild(title)
  header.appendChild(closeBtn)

  const subtitle = document.createElement('p')
  subtitle.className = 'font-body text-sm text-on-surface/60'
  subtitle.textContent = 'Select what you want to grow. Each plant has different focus requirements.'

  const plantList = document.createElement('div')
  plantList.className = 'flex-1 overflow-y-auto space-y-3 pr-1'

  const sortedDefs = [...PLANT_DEFINITIONS].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity])

  for (const def of sortedDefs) {
    const existingPlant = existingPlants.find((p) => p.type === def.id)
    const isGrowing = existingPlant != null

    const card = document.createElement('div')
    card.className = `flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${
      isGrowing
        ? 'bg-surface-container-low/50 opacity-60 cursor-not-allowed'
        : 'bg-surface-container-low/50 hover:bg-surface-container-high/50 cursor-pointer hover:-translate-y-0.5'
    }`

    const iconWrap = document.createElement('div')
    iconWrap.className = 'w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0'
    const bgColor = def.rarity === 'common' ? '#5162331a' : def.rarity === 'uncommon' ? '#934a291a' : def.rarity === 'rare' ? '#3f5d871a' : '#5876a11a'
    iconWrap.style.backgroundColor = bgColor
    iconWrap.textContent = def.emoji

    const info = document.createElement('div')
    info.className = 'flex-1 min-w-0'

    const nameRow = document.createElement('div')
    nameRow.className = 'flex items-center gap-2'

    const name = document.createElement('span')
    name.className = 'font-headline text-sm font-bold text-on-surface'
    name.textContent = def.name

    const badge = document.createElement('span')
    badge.className = `inline-flex px-2 py-0.5 rounded-full text-[10px] font-label font-semibold ${RARITY_BADGE_CLASSES[def.rarity]}`
    badge.textContent = RARITY_LABELS[def.rarity]

    nameRow.appendChild(name)
    nameRow.appendChild(badge)

    const desc = document.createElement('p')
    desc.className = 'font-body text-xs text-on-surface/50 mt-0.5'
    desc.textContent = def.description

    const requirement = document.createElement('span')
    requirement.className = 'font-label text-[10px] text-on-surface/40 mt-1'
    if (isGrowing && existingPlant) {
      const progress = Math.min(1, existingPlant.totalFocusMinutes / def.focusMinutesRequired)
      requirement.textContent = `Growing: ${Math.round(progress * 100)}% complete`
    } else {
      requirement.textContent = `${def.sessionsRequired} session${def.sessionsRequired > 1 ? 's' : ''} • ${def.focusMinutesRequired} min total`
    }

    info.appendChild(nameRow)
    info.appendChild(desc)
    info.appendChild(requirement)

    card.appendChild(iconWrap)
    card.appendChild(info)

    if (!isGrowing) {
      card.addEventListener('click', () => onSelect(def))
    }

    plantList.appendChild(card)
  }

  modal.appendChild(header)
  modal.appendChild(subtitle)
  modal.appendChild(plantList)
  overlay.appendChild(modal)

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) onClose()
  })

  return overlay
}