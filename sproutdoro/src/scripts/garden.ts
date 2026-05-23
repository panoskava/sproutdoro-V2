import '../styles/main.css'
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { createPlantCard } from './components/PlantCard'
import { createStatCard } from './components/StatCard'
import { createPlantingPlanModal } from './components/PlantingPlanModal'
import { getPlantDefinition } from './plant-definitions'
import { getAllPlants, createPlant, getSessions } from './storage'
import { applyTheme } from './theme'
import type { Plant } from '../types'

function openPlantingPlan(plants: import('../types').Plant[]) {
  const modalContainer = document.getElementById('planting-plan-modal-container')
  if (!modalContainer) return

  const modal = createPlantingPlanModal({
    existingPlants: plants,
    onSelect: async (definition) => {
      const plant: import('../types').Plant = {
        id: crypto.randomUUID(),
        type: definition.id,
        rarity: definition.rarity,
        level: 1,
        plantedAt: Date.now(),
        totalFocusMinutes: 0,
        sessionIds: [],
        isMasterpiece: false,
      }
      try {
        await createPlant(plant)
      } catch (err) {
        console.error('Failed to create plant:', err)
      }
      modal.remove()
      location.reload()
    },
    onClose: () => {
      modal.remove()
    },
  })
  modalContainer.appendChild(modal)
}

async function initGardenPage() {
  // Render navs
  const sideNavContainer = document.getElementById('side-nav')
  if (sideNavContainer) {
    sideNavContainer.appendChild(createSideNav('garden'))
  }

  const mobileNavContainer = document.getElementById('mobile-nav')
  if (mobileNavContainer) {
    mobileNavContainer.appendChild(createMobileNav('garden'))
  }

  applyTheme()

  // Load plants
  let plants: Plant[]
  try {
    plants = await getAllPlants()
  } catch (err) {
    console.error('Failed to load plants:', err)
    plants = []
  }

  // Compute stats
  const totalPlants = plants.length
  const totalFocusMinutes = plants.reduce((sum, p) => sum + p.totalFocusMinutes, 0)
  const totalFocusHours = Math.round((totalFocusMinutes / 60) * 10) / 10

  // Render stats
  const statsContainer = document.getElementById('garden-stats')
  if (statsContainer) {
    statsContainer.appendChild(
      createStatCard({
        icon: 'potted_plant',
        iconBg: '#e8f5e9',
        iconColor: '#516233',
        label: 'Total Plants',
        value: String(totalPlants),
      })
    )
    statsContainer.appendChild(
      createStatCard({
        icon: 'schedule',
        iconBg: '#fff3e0',
        iconColor: '#934a29',
        label: 'Focus Hours',
        value: `${totalFocusHours}h`,
      })
    )
  }

  // Render featured plant (use already-fetched plants array)
  const featuredSection = document.getElementById('featured-plant-section')
  const featuredContainer = document.getElementById('featured-plant')
  if (featuredSection && featuredContainer) {
    if (plants.length > 0) {
      const featured = plants.reduce((best, p) =>
        p.totalFocusMinutes > best.totalFocusMinutes ? p : best
      )
      const card = createPlantCard({ plant: featured, isFeatured: true })
      featuredContainer.appendChild(card)
    } else {
      featuredSection.style.display = 'none'
    }
  }

  // Render plant grid
  const gridContainer = document.getElementById('plant-grid')
  if (gridContainer) {
    for (const plant of plants) {
      const card = createPlantCard({ plant })
      gridContainer.appendChild(card)
    }

    // Empty slot CTA
    const emptyCard = document.createElement('button')
    emptyCard.className =
      'rounded-2xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center gap-2 text-on-surface/50 hover:text-primary hover:border-primary/50 transition-all duration-200 cursor-pointer aspect-square'
    emptyCard.innerHTML = `
      <span class="material-symbols-outlined text-3xl">add</span>
      <span class="font-label text-sm font-semibold">New Sprout</span>
    `
    emptyCard.addEventListener('click', () => {
      openPlantingPlan(plants)
    })
    gridContainer.appendChild(emptyCard)
  }

  // Separate plants into active (still growing) vs completed
  const activePlants = plants.filter((p) => {
    const def = getPlantDefinition(p.type)
    return def ? p.totalFocusMinutes < def.focusMinutesRequired : false
  })

  const activeGrowthSection = document.getElementById('active-growth-section')
  const activeGrowthGrid = document.getElementById('active-growth-grid')

  if (activeGrowthSection && activeGrowthGrid && activePlants.length > 0) {
    activeGrowthSection.style.display = ''

    for (const plant of activePlants) {
      const def = getPlantDefinition(plant.type)
      if (!def) continue

      const progress = Math.min(1, plant.totalFocusMinutes / def.focusMinutesRequired)

      const card = document.createElement('div')
      card.className = 'stat-card-glass rounded-2xl p-4 flex items-center gap-4'

      const emojiWrap = document.createElement('div')
      emojiWrap.className = 'w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0'
      emojiWrap.textContent = def.emoji

      const info = document.createElement('div')
      info.className = 'flex-1 min-w-0'

      const name = document.createElement('div')
      name.className = 'font-headline text-sm font-bold text-on-surface'
      name.textContent = def.name

      const progressWrap = document.createElement('div')
      progressWrap.className = 'w-full h-2 bg-surface-container-high rounded-full overflow-hidden mt-1'

      const progressBar = document.createElement('div')
      progressBar.className = 'h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500'
      progressBar.style.width = `${Math.round(progress * 100)}%`

      progressWrap.appendChild(progressBar)

      const meta = document.createElement('div')
      meta.className = 'flex items-center justify-between mt-1'
      const progressText = document.createElement('span')
      progressText.className = 'font-label text-[10px] text-on-surface/50'
      progressText.textContent = `${Math.round(plant.totalFocusMinutes)} / ${def.focusMinutesRequired} min`
      const pct = document.createElement('span')
      pct.className = 'font-label text-[10px] font-semibold text-primary'
      pct.textContent = `${Math.round(progress * 100)}%`
      meta.appendChild(progressText)
      meta.appendChild(pct)

      info.appendChild(name)
      info.appendChild(progressWrap)
      info.appendChild(meta)

      card.appendChild(emojiWrap)
      card.appendChild(info)
      activeGrowthGrid.appendChild(card)
    }
  }

  // FAB
  const fab = document.getElementById('fab-new-sprout')
  if (fab) {
    fab.addEventListener('click', () => {
      openPlantingPlan(plants)
    })
  }
}

initGardenPage().catch(console.error)
