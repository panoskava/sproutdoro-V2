import '../styles/main.css'
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { getInsights, getAllPlants, getSessions, getCategories } from './storage'
import { applyTheme } from './theme'
import type { Insights, Plant, Session, Achievement, Category } from '../types'
import { bootstrapPage } from './init'
import { setPageMeta } from './meta'
import { injectSiteFooter } from './components/SiteFooter'

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function toISODate(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getLast7Days(): string[] {
  const days: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    days.push(toISODate(d.getTime()))
  }
  return days
}

function getDayLabel(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const d = new Date(dateStr + 'T00:00:00')
  return days[d.getDay()]
}

function computeGardenerLevel(totalFocusHours: number): number {
  return Math.floor(totalFocusHours / 5) + 1
}

function computeAchievements(
  insights: Insights,
  plants: Plant[],
  sessions: Session[]
): Achievement[] {
  const workSessions = sessions.filter((s) => s.completed && s.type === 'work')
  const totalFocusHours =
    workSessions.reduce((sum, s) => sum + s.duration, 0) / 60

  const hasLongSession = workSessions.some((s) => s.duration >= 60)
  const rarities = new Set(plants.map((p) => p.rarity))
  const hasAllRarities = ['common', 'uncommon', 'rare', 'legendary'].every(
    (r) => rarities.has(r as Plant['rarity'])
  )
  const hasLegendary = plants.some((p) => p.rarity === 'legendary')

  const defs: Omit<Achievement, 'unlockedAt'>[] = [
    {
      id: 'first-sprout',
      name: 'First Sprout',
      description: 'Complete your first focus session',
      icon: 'sprout',
      condition: 'Complete 1 session',
    },
    {
      id: 'green-thumb',
      name: 'Green Thumb',
      description: 'Grow 10 plants in your garden',
      icon: 'potted_plant',
      condition: 'Grow 10 plants',
    },
    {
      id: 'streak-7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day focus streak',
      icon: 'local_fire_department',
      condition: '7-day streak',
    },
    {
      id: 'streak-30',
      name: 'Monthly Master',
      description: 'Maintain a 30-day focus streak',
      icon: 'auto_awesome',
      condition: '30-day streak',
    },
    {
      id: 'deep-diver',
      name: 'Deep Diver',
      description: 'Complete a 60-minute focus session',
      icon: 'psychology',
      condition: '1 session >= 60 min',
    },
    {
      id: 'collector',
      name: 'Collector',
      description: 'Own one plant of each rarity',
      icon: 'collections',
      condition: '1 of each rarity',
    },
    {
      id: 'legendary',
      name: 'Legendary',
      description: 'Grow a legendary plant',
      icon: 'diamond',
      condition: 'Grow a legendary plant',
    },
    {
      id: 'century',
      name: 'Century Club',
      description: 'Accumulate 100 hours of focus time',
      icon: 'schedule',
      condition: '100 total focus hours',
    },
  ]

  return defs.map((def) => {
    let unlockedAt: number | null = null
    switch (def.id) {
      case 'first-sprout':
        if (workSessions.length >= 1) unlockedAt = workSessions[0].startTime
        break
      case 'green-thumb':
        if (plants.length >= 10) unlockedAt = plants[9].plantedAt
        break
      case 'streak-7':
        if (insights.currentStreak >= 7 || insights.longestStreak >= 7) {
          unlockedAt = workSessions.length > 0 ? workSessions[0].startTime : Date.now()
        }
        break
      case 'streak-30':
        if (insights.currentStreak >= 30 || insights.longestStreak >= 30) {
          unlockedAt = workSessions.length > 0 ? workSessions[0].startTime : Date.now()
        }
        break
      case 'deep-diver':
        if (hasLongSession) {
          const longSession = workSessions.find((s) => s.duration >= 60)
          unlockedAt = longSession ? longSession.startTime : Date.now()
        }
        break
      case 'collector':
        if (hasAllRarities) unlockedAt = Math.max(...plants.map((p) => p.plantedAt))
        break
      case 'legendary':
        if (hasLegendary) unlockedAt = (plants.find((p) => p.rarity === 'legendary'))?.plantedAt ?? Date.now()
        break
      case 'century':
        if (totalFocusHours >= 100) unlockedAt = workSessions[workSessions.length - 1].startTime
        break
    }
    return { ...def, unlockedAt }
  })
}

/* ------------------------------------------------------------------ */
/* Renderers                                                          */
/* ------------------------------------------------------------------ */

function renderStreakCard(insights: Insights): void {
  const numberEl = document.getElementById('streak-number')
  const textEl = document.getElementById('streak-text')
  if (!numberEl || !textEl) return

  numberEl.textContent = String(insights.currentStreak)

  if (insights.currentStreak === 0) {
    textEl.textContent = 'Start focusing today to build your streak!'
  } else if (insights.currentStreak < 3) {
    textEl.textContent = 'Great start! Keep the momentum going.'
  } else if (insights.currentStreak < 7) {
    textEl.textContent = 'You are on fire! Consistency is key.'
  } else {
    textEl.textContent = 'Incredible discipline! You are a true gardener.'
  }
}

function renderBarChart(dailyStats: Insights['dailyStats']): void {
  const container = document.getElementById('bar-chart')
  if (!container) return

  const last7Days = getLast7Days()
  const maxPlants = Math.max(1, ...dailyStats.map((d) => d.plantsGrown))
  const todayKey = toISODate(Date.now())

  container.innerHTML = ''

  for (const dateStr of last7Days) {
    const stat = dailyStats.find((d) => d.date === dateStr)
    const plantsGrown = stat?.plantsGrown ?? 0
    const heightPercent = (plantsGrown / maxPlants) * 100
    const isToday = dateStr === todayKey

    const barWrap = document.createElement('div')
    barWrap.className = 'flex-1 flex flex-col items-center justify-end gap-2'

    const bar = document.createElement('div')
    bar.className = `w-full max-w-[40px] rounded-t-full transition-all duration-500 ${
      isToday ? 'bg-primary' : 'bg-primary/40'
    }`
    bar.style.height = `${Math.max(heightPercent, 4)}%`
    bar.title = `${plantsGrown} plant${plantsGrown === 1 ? '' : 's'}`

    const label = document.createElement('span')
    label.className = `font-label text-[10px] uppercase tracking-wider ${
      isToday ? 'text-primary font-semibold' : 'text-on-surface/50'
    }`
    label.textContent = getDayLabel(dateStr)

    barWrap.appendChild(bar)
    barWrap.appendChild(label)
    container.appendChild(barWrap)
  }
}

function renderPieChart(workSessions: Session[], categories: Category[]): void {
  const container = document.getElementById('pie-chart')
  const legendContainer = document.getElementById('pie-legend')
  if (!container || !legendContainer) return

  const categoryMap: Record<string, number> = {}
  for (const s of workSessions) {
    const cat = s.category || 'uncategorized'
    categoryMap[cat] = (categoryMap[cat] || 0) + s.duration
  }

  const categoryColorMap = new Map<string, string>()
  const categoryNameMap = new Map<string, string>()
  for (const cat of categories) {
    categoryColorMap.set(cat.id, cat.color)
    categoryNameMap.set(cat.id, cat.name)
  }
  categoryColorMap.set('uncategorized', '#76786c')
  categoryNameMap.set('uncategorized', 'Uncategorized')

  const entries = Object.entries(categoryMap)
  const total = entries.reduce((sum, [, duration]) => sum + duration, 0)

  if (total === 0) {
    container.innerHTML = ''
    const empty = document.createElement('div')
    empty.className = 'flex flex-col items-center justify-center w-full h-full gap-2 text-on-surface/40 font-body text-sm text-center p-4'
    const text = document.createElement('p')
    text.textContent = 'No data yet'
    const link = document.createElement('a')
    link.href = './index.html'
    link.className = 'text-primary hover:underline font-label text-xs'
    link.textContent = 'Complete a session to see your stats'
    empty.appendChild(text)
    empty.appendChild(link)
    container.appendChild(empty)
    legendContainer.innerHTML = ''
    return
  }

  const radius = 80
  const center = 96
  const circumference = 2 * Math.PI * radius
  let offset = 0

  let svgContent = `<svg viewBox="0 0 192 192" class="w-full h-full -rotate-90" role="img" aria-label="Focus distribution pie chart">`

  for (const [cat, duration] of entries) {
    const pct = duration / total
    const dashArray = `${pct * circumference} ${circumference}`
    const color = categoryColorMap.get(cat) || '#76786c'

    svgContent += `
      <circle
        cx="${center}" cy="${center}" r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="24"
        stroke-dasharray="${dashArray}"
        stroke-dashoffset="${-offset}"
        stroke-linecap="round"
      />
    `
    offset += pct * circumference
  }

  svgContent += `</svg>`

  const totalHours = Math.round((total / 60) * 10) / 10
  const centerOverlay = document.createElement('div')
  centerOverlay.className =
    'absolute inset-0 flex flex-col items-center justify-center pointer-events-none'
  centerOverlay.innerHTML = `
    <span class="font-headline text-2xl font-bold text-on-surface">${totalHours}</span>
    <span class="font-label text-[10px] uppercase tracking-wider text-on-surface/50">Total hrs</span>
  `

  container.innerHTML = svgContent
  container.classList.add('relative')
  container.appendChild(centerOverlay)

  legendContainer.innerHTML = ''
  for (const [cat, duration] of entries) {
    const pct = Math.round((duration / total) * 100)
    const color = categoryColorMap.get(cat) || '#76786c'
    const label = categoryNameMap.get(cat) || cat

    const item = document.createElement('div')
    item.className = 'flex items-center gap-2'

    const dot = document.createElement('span')
    dot.className = 'w-3 h-3 rounded-full flex-shrink-0'
    dot.style.backgroundColor = color

    const nameSpan = document.createElement('span')
    nameSpan.className = 'font-label text-xs text-on-surface/70'
    nameSpan.textContent = label

    const pctSpan = document.createElement('span')
    pctSpan.className = 'font-label text-xs font-semibold text-on-surface ml-auto'
    pctSpan.textContent = `${pct}%`

    item.appendChild(dot)
    item.appendChild(nameSpan)
    item.appendChild(pctSpan)
    legendContainer.appendChild(item)
  }
}

function renderTotalFocus(
  _workSessions: Session[],
  totalMinutes: number,
  monthlyGoalHours: number
): void {
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10

  const hoursEl = document.getElementById('total-hours')
  const percentEl = document.getElementById('goal-percent')
  const barEl = document.getElementById('goal-bar')
  const textEl = document.getElementById('goal-text')

  if (hoursEl) hoursEl.textContent = String(totalHours)

  const pct = Math.min(100, Math.round((totalHours / monthlyGoalHours) * 100))
  if (percentEl) percentEl.textContent = `${pct}%`
  if (barEl) barEl.style.width = `${pct}%`
  if (textEl) {
    textEl.textContent = `${totalHours} of ${monthlyGoalHours} hours`
  }
}

function renderAchievements(achievements: Achievement[]): void {
  const container = document.getElementById('achievements-grid')
  if (!container) return

  container.innerHTML = ''

  for (const ach of achievements) {
    const isEarned = ach.unlockedAt !== null

    const card = document.createElement('div')
    card.className = `flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 ${
      isEarned
        ? 'bg-primary-container/10 hover:bg-primary-container/20'
        : 'bg-surface-container-high/50 opacity-60 grayscale'
    }`

    const iconWrap = document.createElement('div')
    iconWrap.className = `w-12 h-12 rounded-full flex items-center justify-center ${
      isEarned ? 'bg-primary/10' : 'bg-surface-container-high'
    }`

    const icon = document.createElement('span')
    icon.className = 'material-symbols-outlined text-2xl'
    icon.style.color = isEarned ? '#516233' : '#76786c'
    icon.style.fontVariationSettings = "'FILL' 1, 'wght' 600"
    icon.textContent = ach.icon

    iconWrap.appendChild(icon)

    const name = document.createElement('span')
    name.className = `font-label text-xs font-semibold text-center ${
      isEarned ? 'text-on-surface' : 'text-on-surface/50'
    }`
    name.textContent = ach.name

    const desc = document.createElement('span')
    desc.className =
      'font-body text-[10px] text-on-surface/50 text-center leading-tight'
    desc.textContent = ach.condition

    card.appendChild(iconWrap)
    card.appendChild(name)
    card.appendChild(desc)
    container.appendChild(card)
  }
}

function renderCategoryBreakdown(categoryStats: Insights['categoryStats']): void {
  const container = document.getElementById('category-breakdown')
  if (!container) return

  container.innerHTML = ''

  if (categoryStats.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'font-body text-sm text-on-surface/50 text-center py-6'
    empty.textContent = 'Start focusing with categories to see your breakdown.'
    container.appendChild(empty)
    return
  }

  const totalMinutes = categoryStats.reduce((sum, cs) => sum + cs.totalFocusMinutes, 0)

  for (const cs of categoryStats) {
    const pct = totalMinutes > 0 ? Math.round((cs.totalFocusMinutes / totalMinutes) * 100) : 0
    const hours = Math.floor(cs.totalFocusMinutes / 60)
    const mins = Math.round(cs.totalFocusMinutes % 60)

    const row = document.createElement('div')
    row.className = 'flex flex-col gap-2'

    const topRow = document.createElement('div')
    topRow.className = 'flex items-center justify-between'

    const labelGroup = document.createElement('div')
    labelGroup.className = 'flex items-center gap-2'

    const colorDot = document.createElement('span')
    colorDot.className = 'w-3 h-3 rounded-full flex-shrink-0'
    colorDot.style.backgroundColor = cs.categoryColor

    const name = document.createElement('span')
    name.className = 'font-label text-sm font-semibold text-on-surface'
    name.textContent = cs.categoryName

    const sessionCount = document.createElement('span')
    sessionCount.className = 'font-label text-[10px] text-on-surface/50'
    sessionCount.textContent = `${cs.sessionCount} session${cs.sessionCount === 1 ? '' : 's'}`

    labelGroup.appendChild(colorDot)
    labelGroup.appendChild(name)
    labelGroup.appendChild(sessionCount)

    const timeLabel = document.createElement('span')
    timeLabel.className = 'font-label text-sm font-semibold text-on-surface'
    timeLabel.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

    topRow.appendChild(labelGroup)
    topRow.appendChild(timeLabel)

    const progressWrap = document.createElement('div')
    progressWrap.className = 'w-full h-2 bg-surface-container-high rounded-full overflow-hidden'

    const progressBar = document.createElement('div')
    progressBar.className = 'h-full rounded-full transition-all duration-500'
    progressBar.style.width = `${pct}%`
    progressBar.style.backgroundColor = cs.categoryColor

    progressWrap.appendChild(progressBar)

    row.appendChild(topRow)
    row.appendChild(progressWrap)
    container.appendChild(row)
  }
}

/* ------------------------------------------------------------------ */
/* Init                                                               */
/* ------------------------------------------------------------------ */

async function initInsightsPage(): Promise<void> {
  setPageMeta({
    title: 'Insights',
    description: 'Track focus streaks, session stats, achievements, and category breakdowns.',
    path: 'insights.html',
  })

  const sideNavContainer = document.getElementById('side-nav')
  if (sideNavContainer) {
    sideNavContainer.appendChild(createSideNav('insights'))
  }

  const mobileNavContainer = document.getElementById('mobile-nav')
  if (mobileNavContainer) {
    mobileNavContainer.appendChild(createMobileNav('insights'))
  }

  applyTheme()

  // Load data
  let insights: Insights
  let plants: Plant[]
  let sessions: Session[]

  try {
    insights = await getInsights()
  } catch (err) {
    console.error('Failed to load insights:', err)
    insights = {
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: 0,
      dailyStats: [],
      weeklyStats: [],
      categoryStats: [],
      achievements: [],
      monthlyGoalHours: 40,
    }
  }

  try {
    plants = await getAllPlants()
  } catch (err) {
    console.error('Failed to load plants:', err)
    plants = []
  }

  try {
    sessions = await getSessions()
  } catch (err) {
    console.error('Failed to load sessions:', err)
    sessions = []
  }

  let categories: Category[] = []
  try {
    categories = await getCategories()
  } catch (err) {
    console.error('Failed to load categories:', err)
    categories = []
  }

  // Compute derived data (filter once, reuse)
  const workSessions = sessions.filter((s) => s.completed && s.type === 'work')
  const totalFocusMinutes = workSessions.reduce((sum, s) => sum + s.duration, 0)
  const totalFocusHours = totalFocusMinutes / 60
  const level = computeGardenerLevel(totalFocusHours)

  // Update level badge
  const levelEl = document.getElementById('gardener-level')
  if (levelEl) levelEl.textContent = String(level)

  // Render sections
  renderStreakCard(insights)
  renderBarChart(insights.dailyStats)
  renderPieChart(workSessions, categories)
  renderTotalFocus(workSessions, totalFocusMinutes, insights.monthlyGoalHours)

  const achievements = computeAchievements(insights, plants, sessions)
  renderAchievements(achievements)
  renderCategoryBreakdown(insights.categoryStats)
  injectSiteFooter()
}

bootstrapPage(initInsightsPage).catch(console.error)
