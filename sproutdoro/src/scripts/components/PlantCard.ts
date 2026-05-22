import type { Plant, PlantRarity, PlantLevel } from '../../types'

interface PlantCardProps {
  plant: Plant
  imageUrl?: string
  isFeatured?: boolean
}

const RARITY_CLASSES: Record<PlantRarity, string> = {
  common: 'bg-primary/10 text-primary',
  uncommon: 'bg-secondary/10 text-secondary',
  rare: 'bg-tertiary/10 text-tertiary',
  legendary: 'bg-secondary-fixed/30 text-on-secondary-fixed-variant',
}

const LEVEL_CLASSES: Record<PlantLevel, string> = {
  1: 'text-primary',
  2: 'text-primary',
  3: 'text-primary-container',
  4: 'text-secondary',
  5: 'text-secondary-container',
}

export function createPlantCard(props: PlantCardProps): HTMLElement {
  const { plant, imageUrl, isFeatured = false } = props
  const imgSrc =
    imageUrl ||
    'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&h=400&fit=crop'

  if (isFeatured) {
    const card = document.createElement('div')
    card.className =
      'timer-glass rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center'

    const imgWrap = document.createElement('div')
    imgWrap.className =
      'w-full md:w-48 h-48 rounded-2xl overflow-hidden flex-shrink-0'
    const img = document.createElement('img')
    img.src = imgSrc
    img.alt = plant.type
    img.className = 'w-full h-full object-cover'
    imgWrap.appendChild(img)

    const details = document.createElement('div')
    details.className = 'flex flex-col gap-2 flex-1'

    const badge = document.createElement('span')
    badge.className =
      'inline-flex self-start px-3 py-1 rounded-full text-xs font-label font-semibold bg-secondary/10 text-secondary'
    badge.textContent = 'Masterpiece'

    const name = document.createElement('h3')
    name.className = 'font-headline text-xl font-bold text-on-surface'
    name.textContent = plant.type

    const meta = document.createElement('p')
    meta.className = 'text-sm text-on-surface/60'
    const plantedDate = new Date(plant.plantedAt).toLocaleDateString()
    meta.textContent = `Planted on ${plantedDate} • Level ${plant.level}`

    details.appendChild(badge)
    details.appendChild(name)
    details.appendChild(meta)

    card.appendChild(imgWrap)
    card.appendChild(details)
    return card
  }

  // Regular card
  const card = document.createElement('div')
  card.className =
    'stat-card-glass rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 cursor-default'

  const imgWrap = document.createElement('div')
  imgWrap.className = 'w-full aspect-square rounded-xl overflow-hidden relative'
  const img = document.createElement('img')
  img.src = imgSrc
  img.alt = plant.type
  img.className = 'w-full h-full object-cover'
  imgWrap.appendChild(img)

  const rarityBadge = document.createElement('span')
  rarityBadge.className = `absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-label font-semibold ${RARITY_CLASSES[plant.rarity]}`
  rarityBadge.textContent =
    plant.rarity.charAt(0).toUpperCase() + plant.rarity.slice(1)
  imgWrap.appendChild(rarityBadge)

  const info = document.createElement('div')
  info.className = 'flex flex-col gap-1'

  const name = document.createElement('h4')
  name.className = 'font-headline text-sm font-bold text-on-surface'
  name.textContent = plant.type

  const date = document.createElement('span')
  date.className = 'text-xs text-on-surface/50'
  const plantedDate = new Date(plant.plantedAt).toLocaleDateString()
  date.textContent = plantedDate

  // Maturity progress bar
  const maxFocusMinutes = (plant.level as number) * 60
  const maturity = Math.min(1, plant.totalFocusMinutes / maxFocusMinutes)
  const progressWrap = document.createElement('div')
  progressWrap.className =
    'w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-1'
  const progressBar = document.createElement('div')
  progressBar.className = 'h-full bg-primary rounded-full transition-all duration-500'
  progressBar.style.width = `${maturity * 100}%`
  progressWrap.appendChild(progressBar)

  const levelText = document.createElement('span')
  levelText.className = `text-xs font-label font-semibold ${LEVEL_CLASSES[plant.level]}`
  levelText.textContent = `Level ${plant.level}`

  info.appendChild(name)
  info.appendChild(date)
  info.appendChild(progressWrap)
  info.appendChild(levelText)

  card.appendChild(imgWrap)
  card.appendChild(info)
  return card
}
