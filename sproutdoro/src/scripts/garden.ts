import '../styles/main.css'
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { createPlantCard } from './components/PlantCard'
import { createStatCard } from './components/StatCard'
import { getAllPlants } from './storage'
import { applyTheme } from './theme'
import type { Plant } from '../types'

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
      window.location.href = './index.html'
    })
    gridContainer.appendChild(emptyCard)
  }

  // FAB
  const fab = document.getElementById('fab-new-sprout')
  if (fab) {
    fab.addEventListener('click', () => {
      window.location.href = './index.html'
    })
  }
}

initGardenPage().catch(console.error)
