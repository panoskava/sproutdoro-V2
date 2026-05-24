# Sproutdoro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete garden-themed Pomodoro timer web app with 4 screens, local storage, PWA support, and Docker deployment.

**Architecture:** Multi-page HTML app built with Vite + TypeScript + Tailwind CSS. Each screen is a separate HTML file sharing TS components and IndexedDB storage. PWA via Vite PWA plugin. Dockerized with nginx:alpine.

**Tech Stack:** Vite, TypeScript, Tailwind CSS, `idb` (IndexedDB), Vite PWA Plugin, Material Symbols, gh CLI

---

## File Structure (Target)

```
/Volumes/panoskava_ext/Code_projects/Sproutdoro-V2/
├── sproutdoro/
│   ├── index.html                    # Focus Timer (home)
│   ├── settings.html                 # Configuration
│   ├── insights.html                 # Analytics
│   ├── garden.html                   # Plant collection
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── manifest.json                 # PWA manifest
│   ├── public/
│   │   ├── icons/
│   │   │   ├── icon-192x192.png
│   │   │   └── icon-512x512.png
│   │   └── sounds/
│   │       ├── wind-chimes.mp3
│   │       ├── birdsong.mp3
│   │       ├── rain.mp3
│   │       └── complete.mp3
│   ├── src/
│   │   ├── styles/
│   │   │   ├── main.css              # Tailwind + custom utilities
│   │   │   ├── animations.css        # Keyframes + transitions
│   │   │   └── components.css        # Shared component styles
│   │   ├── scripts/
│   │   │   ├── storage.ts            # IndexedDB wrapper (idb)
│   │   │   ├── state.ts              # Global state manager
│   │   │   ├── audio.ts              # Sound manager
│   │   │   ├── timer.ts              # Timer page logic
│   │   │   ├── settings.ts           # Settings page logic
│   │   │   ├── insights.ts           # Insights page logic
│   │   │   ├── garden.ts             # Garden page logic
│   │   │   └── components/
│   │   │       ├── SideNav.ts
│   │   │       ├── MobileNav.ts
│   │   │       ├── CircularProgress.ts
│   │   │       ├── StatCard.ts
│   │   │       ├── PlantCard.ts
│   │   │       ├── RangeSlider.ts
│   │   │       ├── ToggleSwitch.ts
│   │   │       └── SoundCard.ts
│   │   └── types.ts                  # Shared TypeScript interfaces
│   └── Dockerfile
├── nginx.conf
├── docker-compose.yml
├── .gitignore
└── docs/
    └── superpowers/
        ├── specs/2026-05-22-sproutdoro-design.md
        └── plans/2026-05-22-sproutdoro-plan.md  (this file)
```

---

## Git Workflow

All work happens on feature branches. Main branch only has working, complete features.

```bash
# Before each task group:
git checkout -b feature/<name>

# After each task group:
git add -A
git commit -m "<type>: <description>"
git push -u origin feature/<name>
gh pr create --title "<type>: <description>" --body "Implements ..." --base main
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

---

## Task 1: Project Scaffold

**Branch:** `feature/project-scaffold`

**Goal:** Initialize Vite project, configure Tailwind, set up TypeScript, create shared entry files.

**Files:**
- Create: `sproutdoro/package.json`
- Create: `sproutdoro/vite.config.ts`
- Create: `sproutdoro/tailwind.config.js`
- Create: `sproutdoro/tsconfig.json`
- Create: `sproutdoro/src/types.ts`
- Create: `sproutdoro/src/styles/main.css`
- Create: `sproutdoro/src/styles/animations.css`
- Create: `sproutdoro/src/styles/components.css`
- Modify: `sproutdoro/index.html` (replace Vite default)

- [ ] **Step 1: Configure package.json**

```json
{
  "name": "sproutdoro",
  "private": true,
  "version": "2.4.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "vite-plugin-pwa": "^0.17.0"
  },
  "dependencies": {
    "idb": "^7.1.1"
  }
}
```

Run: `cd sproutdoro && npm install`

- [ ] **Step 2: Configure Tailwind**

File: `sproutdoro/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./settings.html",
    "./insights.html",
    "./garden.html",
    "./src/**/*.{ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        'on-secondary-container': '#763315',
        'surface-dim': '#dddad0',
        'secondary-fixed': '#ffdbce',
        'on-error-container': '#93000a',
        'tertiary-fixed-dim': '#aac8f8',
        'surface-variant': '#e6e2d8',
        'primary-container': '#697b49',
        'tertiary': '#3f5d87',
        'inverse-primary': '#bbce95',
        'surface-bright': '#fdf9ef',
        'on-secondary-fixed': '#370e00',
        'surface-container': '#f1eee4',
        'surface': '#fdf9ef',
        'secondary': '#934a29',
        'primary-fixed-dim': '#bbce95',
        'outline-variant': '#c6c8ba',
        'surface-container-lowest': '#ffffff',
        'inverse-on-surface': '#f4f0e7',
        'tertiary-fixed': '#d4e3ff',
        'on-tertiary-fixed': '#001c3a',
        'on-primary-fixed-variant': '#3c4c20',
        'on-error': '#ffffff',
        'error': '#ba1a1a',
        'tertiary-container': '#5876a1',
        'surface-container-low': '#f7f3e9',
        'inverse-surface': '#31312a',
        'outline': '#76786c',
        'error-container': '#ffdad6',
        'background': '#fdf9ef',
        'on-surface-variant': '#45483d',
        'primary-fixed': '#d6eaaf',
        'on-tertiary': '#ffffff',
        'surface-container-high': '#ece8de',
        'on-surface': '#1c1c16',
        'on-secondary': '#ffffff',
        'secondary-fixed-dim': '#ffb598',
        'secondary-container': '#fd9e77',
        'on-tertiary-container': '#fefcff',
        'on-tertiary-fixed-variant': '#284870',
        'on-primary-fixed': '#131f00',
        'primary': '#516233',
        'on-secondary-fixed-variant': '#763314',
        'on-primary-container': '#faffe8',
        'on-primary': '#ffffff',
        'on-background': '#1c1c16',
        'surface-tint': '#546435',
        'surface-container-highest': '#e6e2d8'
      },
      borderRadius: {
        'DEFAULT': '1rem',
        'lg': '2rem',
        'xl': '3rem',
        'full': '9999px'
      },
      fontFamily: {
        'headline': ['Plus Jakarta Sans', 'sans-serif'],
        'body': ['Be Vietnam Pro', 'sans-serif'],
        'label': ['Plus Jakarta Sans', 'sans-serif']
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Configure PostCSS**

File: `sproutdoro/postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 4: Configure Vite**

File: `sproutdoro/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        settings: './settings.html',
        insights: './insights.html',
        garden: './garden.html',
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sproutdoro - Focus Timer',
        short_name: 'Sproutdoro',
        description: 'A garden-themed Pomodoro timer that grows with your focus',
        theme_color: '#516233',
        background_color: '#fdf9ef',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
```

- [ ] **Step 5: Create TypeScript types**

File: `sproutdoro/src/types.ts`

```typescript
export interface Settings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  theme: 'light' | 'dark'
  sound: 'wind-chimes' | 'birdsong' | 'rain'
  volume: number
  autoStartBreaks: boolean
  notifications: boolean
}

export interface Session {
  id: string
  startTime: number
  endTime: number
  duration: number
  type: 'work' | 'shortBreak' | 'longBreak'
  plantId: string | null
  category: string
  completed: boolean
}

export type PlantRarity = 'common' | 'uncommon' | 'rare' | 'legendary'
export type PlantLevel = 1 | 2 | 3 | 4 | 5

export interface Plant {
  id: string
  type: string
  rarity: PlantRarity
  level: PlantLevel
  plantedAt: number
  totalFocusMinutes: number
  sessionIds: string[]
  isMasterpiece: boolean
}

export interface GardenState {
  plants: Plant[]
  totalPlants: number
  totalFocusHours: number
  unlockedTypes: string[]
  featuredPlantId: string | null
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: number | null
  condition: string
}

export interface Insights {
  currentStreak: number
  longestStreak: number
  lastSessionDate: number
  dailyStats: Array<{
    date: string
    sessionsCompleted: number
    plantsGrown: number
    totalFocusMinutes: number
  }>
  weeklyStats: Array<{
    weekStart: string
    totalFocusMinutes: number
    plantsGrown: number
  }>
  achievements: Achievement[]
  monthlyGoalHours: number
}

export interface AppState {
  currentScreen: 'focus' | 'settings' | 'insights' | 'garden'
  timer: {
    mode: 'work' | 'shortBreak' | 'longBreak'
    state: 'idle' | 'running' | 'paused' | 'complete'
    remainingSeconds: number
    totalSeconds: number
    sessionCount: number
  }
  settings: Settings
  garden: GardenState
}
```

- [ ] **Step 6: Create base CSS**

File: `sproutdoro/src/styles/main.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

@layer base {
  body {
    font-family: 'Be Vietnam Pro', sans-serif;
    color: #1c1c16;
    background-color: #fdf9ef;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
}

@layer components {
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
  
  .timer-svg {
    transform: rotate(-90deg);
  }
  
  .glass-sage {
    background: rgba(247, 243, 233, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
  
  .timer-glass {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px 0 rgba(81, 98, 51, 0.1);
  }
  
  .stat-card-glass {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 24px -2px rgba(81, 98, 51, 0.05);
  }
  
  .image-mask {
    mask-image: radial-gradient(circle, black 40%, transparent 70%);
    -webkit-mask-image: radial-gradient(circle, black 40%, transparent 70%);
  }
}
```

- [ ] **Step 7: Create animations CSS**

File: `sproutdoro/src/styles/animations.css`

```css
@layer utilities {
  .animate-bounce-subtle {
    animation: bounce-subtle 3s infinite ease-in-out;
  }
  
  @keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  
  .transition-organic {
    transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}
```

- [ ] **Step 8: Test build**

Run: `cd sproutdoro && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: initialize Vite + TypeScript + Tailwind project scaffold"
git push -u origin feature/project-scaffold
gh pr create --title "chore: initialize project scaffold" --body "Sets up Vite, TypeScript, Tailwind CSS, and PWA configuration" --base main
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

---

## Task 2: Storage Layer (IndexedDB)

**Branch:** `feature/storage-layer`

**Goal:** Implement IndexedDB wrapper with all stores, CRUD operations, and default settings.

**Files:**
- Create: `sproutdoro/src/scripts/storage.ts`

- [ ] **Step 1: Install idb package**

Run: `cd sproutdoro && npm install idb`

- [ ] **Step 2: Implement storage module**

File: `sproutdoro/src/scripts/storage.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Settings, Session, Plant, Insights, Achievement } from '../types'

interface SproutdoroDB extends DBSchema {
  settings: {
    key: string
    value: Settings
  }
  sessions: {
    key: string
    value: Session
    indexes: { 'by-date': number; 'by-type': string }
  }
  plants: {
    key: string
    value: Plant
    indexes: { 'by-rarity': string; 'by-level': number }
  }
  insights: {
    key: string
    value: Insights
  }
}

const DB_NAME = 'sproutdoro-db'
const DB_VERSION = 1

let db: IDBPDatabase<SproutdoroDB> | null = null

export async function initDB(): Promise<IDBPDatabase<SproutdoroDB>> {
  if (db) return db
  
  db = await openDB<SproutdoroDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('sessions')) {
        const sessionStore = database.createObjectStore('sessions', { keyPath: 'id' })
        sessionStore.createIndex('by-date', 'startTime')
        sessionStore.createIndex('by-type', 'type')
      }
      if (!database.objectStoreNames.contains('plants')) {
        const plantStore = database.createObjectStore('plants', { keyPath: 'id' })
        plantStore.createIndex('by-rarity', 'rarity')
        plantStore.createIndex('by-level', 'level')
      }
      if (!database.objectStoreNames.contains('insights')) {
        database.createObjectStore('insights', { keyPath: 'id' })
      }
    },
  })
  
  return db
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  theme: 'light',
  sound: 'wind-chimes',
  volume: 50,
  autoStartBreaks: true,
  notifications: true,
}

// Settings operations
export async function getSettings(): Promise<Settings> {
  const database = await initDB()
  const settings = await database.get('settings', 'default')
  return settings || DEFAULT_SETTINGS
}

export async function saveSettings(settings: Settings): Promise<void> {
  const database = await initDB()
  await database.put('settings', { ...settings, id: 'default' })
}

// Session operations
export async function createSession(session: Session): Promise<void> {
  const database = await initDB()
  await database.put('sessions', session)
}

export async function getSessions(startDate?: Date, endDate?: Date): Promise<Session[]> {
  const database = await initDB()
  const allSessions = await database.getAll('sessions')
  
  if (!startDate && !endDate) return allSessions
  
  return allSessions.filter(session => {
    if (startDate && session.startTime < startDate.getTime()) return false
    if (endDate && session.startTime > endDate.getTime()) return false
    return true
  })
}

export async function getTodaySessions(): Promise<Session[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return getSessions(today)
}

export async function getSessionById(id: string): Promise<Session | undefined> {
  const database = await initDB()
  return database.get('sessions', id)
}

// Plant operations
export async function createPlant(plant: Plant): Promise<void> {
  const database = await initDB()
  await database.put('plants', plant)
}

export async function getAllPlants(): Promise<Plant[]> {
  const database = await initDB()
  return database.getAll('plants')
}

export async function getPlantById(id: string): Promise<Plant | undefined> {
  const database = await initDB()
  return database.get('plants', id)
}

export async function updatePlant(plant: Plant): Promise<void> {
  const database = await initDB()
  await database.put('plants', plant)
}

export async function getFeaturedPlant(): Promise<Plant | undefined> {
  const plants = await getAllPlants()
  if (plants.length === 0) return undefined
  return plants.reduce((max, plant) => 
    plant.totalFocusMinutes > max.totalFocusMinutes ? plant : max
  )
}

// Insights operations
export async function getInsights(): Promise<Insights> {
  const database = await initDB()
  const insights = await database.get('insights', 'default')
  
  if (insights) return insights
  
  // Compute from sessions if not cached
  return computeInsights()
}

export async function updateInsights(insights: Insights): Promise<void> {
  const database = await initDB()
  await database.put('insights', { ...insights, id: 'default' })
}

async function computeInsights(): Promise<Insights> {
  const sessions = await getSessions()
  const plants = await getAllPlants()
  
  // Calculate streak
  const completedSessions = sessions.filter(s => s.completed && s.type === 'work')
  const streak = calculateStreak(completedSessions)
  
  // Calculate daily stats
  const dailyStats = calculateDailyStats(completedSessions, plants)
  
  return {
    currentStreak: streak.current,
    longestStreak: streak.longest,
    lastSessionDate: streak.lastDate,
    dailyStats,
    weeklyStats: [], // TODO: calculate from dailyStats
    achievements: [],
    monthlyGoalHours: 40,
  }
}

function calculateStreak(sessions: Session[]): { current: number; longest: number; lastDate: number } {
  if (sessions.length === 0) return { current: 0, longest: 0, lastDate: 0 }
  
  const dates = [...new Set(sessions.map(s => {
    const d = new Date(s.startTime)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }))].sort((a, b) => b - a) // descending
  
  let current = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Check if last session was today or yesterday
  const lastDate = dates[0]
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (lastDate === today.getTime() || lastDate === yesterday.getTime()) {
    current = 1
    for (let i = 1; i < dates.length; i++) {
      const expected = new Date(dates[i - 1])
      expected.setDate(expected.getDate() - 1)
      if (dates[i] === expected.getTime()) {
        current++
      } else {
        break
      }
    }
  }
  
  // Calculate longest streak
  let longest = 1
  let currentLongest = 1
  for (let i = 1; i < dates.length; i++) {
    const expected = new Date(dates[i - 1])
    expected.setDate(expected.getDate() - 1)
    if (dates[i] === expected.getTime()) {
      currentLongest++
      longest = Math.max(longest, currentLongest)
    } else {
      currentLongest = 1
    }
  }
  
  return { current, longest, lastDate }
}

function calculateDailyStats(sessions: Session[], plants: Plant[]) {
  const stats = new Map<string, { sessionsCompleted: number; plantsGrown: number; totalFocusMinutes: number }>()
  
  sessions.forEach(session => {
    const d = new Date(session.startTime)
    const dateKey = d.toISOString().split('T')[0]
    
    if (!stats.has(dateKey)) {
      stats.set(dateKey, { sessionsCompleted: 0, plantsGrown: 0, totalFocusMinutes: 0 })
    }
    
    const stat = stats.get(dateKey)!
    stat.sessionsCompleted++
    stat.totalFocusMinutes += session.duration
  })
  
  plants.forEach(plant => {
    const d = new Date(plant.plantedAt)
    const dateKey = d.toISOString().split('T')[0]
    
    if (!stats.has(dateKey)) {
      stats.set(dateKey, { sessionsCompleted: 0, plantsGrown: 0, totalFocusMinutes: 0 })
    }
    
    stats.get(dateKey)!.plantsGrown++
  })
  
  return Array.from(stats.entries()).map(([date, stat]) => ({
    date,
    ...stat,
  })).sort((a, b) => a.date.localeCompare(b.date))
}
```

- [ ] **Step 3: Test storage module**

Create a simple test in `sproutdoro/src/scripts/storage.test.ts` (manual verification):

```typescript
import { initDB, getSettings, saveSettings, DEFAULT_SETTINGS } from './storage'

async function testStorage() {
  await initDB()
  
  // Test settings
  const settings = await getSettings()
  console.log('Default settings:', settings)
  console.assert(settings.workDuration === 25, 'Default work duration should be 25')
  
  // Test save and retrieve
  const newSettings = { ...DEFAULT_SETTINGS, workDuration: 30 }
  await saveSettings(newSettings)
  const retrieved = await getSettings()
  console.assert(retrieved.workDuration === 30, 'Saved work duration should be 30')
  
  // Reset to default
  await saveSettings(DEFAULT_SETTINGS)
  console.log('Storage tests passed!')
}

testStorage().catch(console.error)
```

Run: `cd sproutdoro && npx vite-node src/scripts/storage.test.ts`
Expected: All assertions pass, console shows "Storage tests passed!"

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: implement IndexedDB storage layer with all stores and CRUD operations"
git push -u origin feature/storage-layer
gh pr create --title "feat: add IndexedDB storage layer" --body "Implements storage module with settings, sessions, plants, and insights stores. Includes default values and helper functions." --base main
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

---

## Task 3: Shared Components

**Branch:** `feature/shared-components`

**Goal:** Build reusable navigation and UI components used across all pages.

**Files:**
- Create: `sproutdoro/src/scripts/components/SideNav.ts`
- Create: `sproutdoro/src/scripts/components/MobileNav.ts`
- Create: `sproutdoro/src/scripts/components/CircularProgress.ts`
- Create: `sproutdoro/src/scripts/components/StatCard.ts`

- [ ] **Step 1: Implement SideNav**

File: `sproutdoro/src/scripts/components/SideNav.ts`

```typescript
export interface NavItem {
  icon: string
  label: string
  href: string
  active?: boolean
}

export function createSideNav(currentPage: string): HTMLElement {
  const navItems: NavItem[] = [
    { icon: 'timer', label: 'Focus', href: './index.html' },
    { icon: 'potted_plant', label: 'Garden', href: './garden.html' },
    { icon: 'bar_chart', label: 'Insights', href: './insights.html' },
    { icon: 'settings', label: 'Config', href: './settings.html' },
  ]
  
  const aside = document.createElement('aside')
  aside.className = 'hidden md:flex flex-col gap-8 py-10 px-6 h-screen w-72 rounded-r-[2.5rem] sticky left-0 top-0 glass-sage shadow-[4px_0_24px_rgba(81,98,51,0.04)] z-50 transition-all duration-300'
  
  // Logo section
  const logoSection = document.createElement('div')
  logoSection.className = 'flex flex-col items-center gap-3 mb-6'
  logoSection.innerHTML = `
    <div class="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-primary-container to-secondary-container shadow-sm mb-1">
      <div class="w-full h-full rounded-full overflow-hidden border-2 border-surface">
        <div class="w-full h-full rounded-full bg-primary-fixed flex items-center justify-center">
          <span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1;">psychiatry</span>
        </div>
      </div>
    </div>
    <div class="text-center">
      <h1 class="text-2xl font-bold text-primary font-headline tracking-tight">Sproutdoro</h1>
      <p class="text-[0.7rem] font-semibold tracking-widest uppercase text-on-surface-variant/70 font-label mt-1">Keep growing</p>
    </div>
  `
  
  // Navigation
  const nav = document.createElement('nav')
  nav.className = 'flex flex-col gap-3 w-full'
  
  navItems.forEach(item => {
    const isActive = item.label.toLowerCase() === currentPage.toLowerCase()
    const link = document.createElement('a')
    link.href = item.href
    link.className = `flex items-center gap-4 px-5 py-3.5 font-label text-sm font-semibold tracking-wide rounded-2xl transition-all hover:shadow-md ${
      isActive 
        ? 'bg-surface/80 text-primary shadow-sm ring-1 ring-primary/10' 
        : 'text-on-surface-variant/70 hover:bg-surface/50 hover:text-primary'
    }`
    link.innerHTML = `
      <span class="material-symbols-outlined ${isActive ? 'text-primary' : ''}" ${isActive ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>${item.icon}</span>
      ${item.label}
    `
    nav.appendChild(link)
  })
  
  // Start Session button
  const buttonSection = document.createElement('div')
  buttonSection.className = 'mt-auto pt-6 w-full'
  buttonSection.innerHTML = `
    <button id="side-nav-start-session" class="w-full py-4 rounded-2xl bg-primary text-on-primary font-label text-sm font-bold tracking-wide shadow-[0_8px_16px_rgba(81,98,51,0.2)] hover:shadow-[0_12px_24px_rgba(81,98,51,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200">
      Start Session
    </button>
  `
  
  aside.appendChild(logoSection)
  aside.appendChild(nav)
  aside.appendChild(buttonSection)
  
  return aside
}
```

- [ ] **Step 2: Implement MobileNav**

File: `sproutdoro/src/scripts/components/MobileNav.ts`

```typescript
export function createMobileNav(currentPage: string): HTMLElement {
  const navItems = [
    { icon: 'timer', label: 'Focus', href: './index.html' },
    { icon: 'potted_plant', label: 'Garden', href: './garden.html' },
    { icon: 'bar_chart', label: 'Insights', href: './insights.html' },
    { icon: 'settings', label: 'Config', href: './settings.html' },
  ]
  
  const nav = document.createElement('div')
  nav.className = 'fixed bottom-6 left-6 right-6 md:hidden glass-sage rounded-full px-6 py-4 flex justify-between items-center z-50 shadow-lg'
  
  // Show FAB for focus and garden pages
  const showFab = currentPage === 'focus' || currentPage === 'garden'
  
  navItems.forEach(item => {
    const isActive = item.label.toLowerCase() === currentPage.toLowerCase()
    
    if (item.label === 'Focus' && showFab) {
      // Skip Focus, will be handled by FAB area
      return
    }
    
    const button = document.createElement('button')
    button.className = `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface-variant/60 hover:text-primary'} transition-colors`
    button.innerHTML = `
      <span class="material-symbols-outlined text-2xl" ${isActive ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>${item.icon}</span>
      <span class="text-[0.6rem] font-label font-bold">${item.label}</span>
    `
    button.onclick = () => window.location.href = item.href
    nav.appendChild(button)
  })
  
  if (showFab) {
    const fabContainer = document.createElement('div')
    fabContainer.className = 'relative -top-8'
    fabContainer.innerHTML = `
      <button id="mobile-fab" class="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-[0_8px_16px_rgba(81,98,51,0.3)] border-4 border-surface text-on-primary hover:scale-105 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-3xl">add</span>
      </button>
    `
    // Insert FAB in middle
    nav.insertBefore(fabContainer, nav.children[nav.children.length > 2 ? 2 : nav.children.length])
  }
  
  return nav
}
```

- [ ] **Step 3: Implement CircularProgress**

File: `sproutdoro/src/scripts/components/CircularProgress.ts`

```typescript
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
  const { size, strokeWidth, progress, color = 'primary', trackColor = 'surface-variant/50', showSunDot = true, sunDotColor = '#fd9e77' } = props
  
  const radius = (size / 2) - strokeWidth
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)
  const rotation = progress * 360
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'timer-svg w-full h-full absolute inset-0 overflow-visible pointer-events-none')
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`)
  
  // Background track
  const bgTrack = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  bgTrack.setAttribute('cx', String(size / 2))
  bgTrack.setAttribute('cy', String(size / 2))
  bgTrack.setAttribute('r', String(radius))
  bgTrack.setAttribute('fill', 'transparent')
  bgTrack.setAttribute('stroke', 'currentColor')
  bgTrack.setAttribute('stroke-width', '4')
  bgTrack.setAttribute('class', `text-${trackColor}`)
  svg.appendChild(bgTrack)
  
  // Progress track (thick, subtle)
  const progressTrack = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  progressTrack.setAttribute('cx', String(size / 2))
  progressTrack.setAttribute('cy', String(size / 2))
  progressTrack.setAttribute('r', String(radius))
  progressTrack.setAttribute('fill', 'transparent')
  progressTrack.setAttribute('stroke', 'currentColor')
  progressTrack.setAttribute('stroke-width', String(strokeWidth))
  progressTrack.setAttribute('class', `text-${color}/10`)
  svg.appendChild(progressTrack)
  
  // Active progress arc
  const activeArc = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  activeArc.setAttribute('cx', String(size / 2))
  activeArc.setAttribute('cy', String(size / 2))
  activeArc.setAttribute('r', String(radius))
  activeArc.setAttribute('fill', 'transparent')
  activeArc.setAttribute('stroke', 'currentColor')
  activeArc.setAttribute('stroke-width', String(strokeWidth))
  activeArc.setAttribute('stroke-dasharray', String(circumference))
  activeArc.setAttribute('stroke-dashoffset', String(offset))
  activeArc.setAttribute('stroke-linecap', 'round')
  activeArc.setAttribute('class', `text-${color} transition-all duration-1000 ease-linear`)
  svg.appendChild(activeArc)
  
  // Sun dot
  if (showSunDot) {
    const sunDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    sunDot.setAttribute('r', '10')
    sunDot.setAttribute('fill', sunDotColor)
    sunDot.setAttribute('style', `transform-origin: ${size / 2}px ${size / 2}px; transform: rotate(${rotation}deg); filter: drop-shadow(0 0 8px rgba(253, 158, 119, 0.6));`)
    
    // Position at progress endpoint
    const angle = (progress * 360 - 90) * (Math.PI / 180)
    const x = size / 2 + radius * Math.cos(angle)
    const y = size / 2 + radius * Math.sin(angle)
    sunDot.setAttribute('cx', String(x))
    sunDot.setAttribute('cy', String(y))
    
    svg.appendChild(sunDot)
    
    // Inner dot
    const innerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    innerDot.setAttribute('r', '4')
    innerDot.setAttribute('fill', '#fdf9ef')
    innerDot.setAttribute('cx', String(x))
    innerDot.setAttribute('cy', String(y))
    svg.appendChild(innerDot)
  }
  
  return svg
}

export function updateCircularProgress(svg: SVGSVGElement, progress: number): void {
  const activeArc = svg.querySelector('circle:nth-child(3)') as SVGCircleElement
  const radius = parseFloat(activeArc.getAttribute('r') || '0')
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)
  
  activeArc.setAttribute('stroke-dashoffset', String(offset))
  
  // Update sun dot position
  const sunDot = svg.querySelector('circle:nth-child(4)') as SVGCircleElement
  if (sunDot) {
    const angle = (progress * 360 - 90) * (Math.PI / 180)
    const x = parseFloat(svg.getAttribute('viewBox')?.split(' ')[2] || '0') / 2 + radius * Math.cos(angle)
    const y = parseFloat(svg.getAttribute('viewBox')?.split(' ')[3] || '0') / 2 + radius * Math.sin(angle)
    sunDot.setAttribute('cx', String(x))
    sunDot.setAttribute('cy', String(y))
  }
}
```

- [ ] **Step 4: Implement StatCard**

File: `sproutdoro/src/scripts/components/StatCard.ts`

```typescript
interface StatCardProps {
  icon: string
  iconBg: string
  iconColor: string
  label: string
  value: string
  delay?: number
}

export function createStatCard(props: StatCardProps): HTMLElement {
  const { icon, iconBg, iconColor, label, value, delay = 0 } = props
  
  const card = document.createElement('div')
  card.className = 'stat-card-glass p-5 md:p-6 rounded-3xl flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-300'
  if (delay > 0) {
    card.style.animationDelay = `${delay}ms`
  }
  
  card.innerHTML = `
    <div class="w-10 h-10 rounded-full ${iconBg} flex items-center justify-center ${iconColor}">
      <span class="material-symbols-outlined text-xl">${icon}</span>
    </div>
    <div>
      <h3 class="text-[0.65rem] font-label uppercase tracking-[0.1em] text-on-surface-variant/70 font-semibold mb-1">${label}</h3>
      <p class="text-base md:text-lg font-headline font-bold text-on-surface">${value}</p>
    </div>
  `
  
  return card
}
```

- [ ] **Step 5: Test components**

Create test page `sproutdoro/test-components.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Component Test</title>
  <link rel="stylesheet" href="./src/styles/main.css">
  <link rel="stylesheet" href="./src/styles/animations.css">
</head>
<body class="bg-surface">
  <div id="test-container" class="p-8"></div>
  <script type="module">
    import { createSideNav } from './src/scripts/components/SideNav.ts'
    import { createMobileNav } from './src/scripts/components/MobileNav.ts'
    import { createCircularProgress } from './src/scripts/components/CircularProgress.ts'
    import { createStatCard } from './src/scripts/components/StatCard.ts'
    
    const container = document.getElementById('test-container')
    
    // Test SideNav
    container.appendChild(createSideNav('focus'))
    
    // Test CircularProgress
    const progressContainer = document.createElement('div')
    progressContainer.className = 'w-64 h-64 relative'
    const progress = createCircularProgress({ size: 256, strokeWidth: 16, progress: 0.75 })
    progressContainer.appendChild(progress)
    container.appendChild(progressContainer)
    
    // Test StatCard
    container.appendChild(createStatCard({
      icon: 'water_drop',
      iconBg: 'bg-primary-container/20',
      iconColor: 'text-primary',
      label: 'Hydration',
      value: 'Optimal'
    }))
    
    console.log('Components rendered successfully')
  </script>
</body>
</html>
```

Run: `cd sproutdoro && npm run dev`
Open: `http://localhost:5173/test-components.html`
Expected: SideNav, progress ring, and stat card visible

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add shared components (SideNav, MobileNav, CircularProgress, StatCard)"
git push -u origin feature/shared-components
gh pr create --title "feat: add shared UI components" --body "Adds reusable navigation and display components used across all pages. Includes SideNav, MobileNav, CircularProgress, and StatCard." --base main
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

---

## Task 4: Focus Timer Page

**Branch:** `feature/timer-page`

**Goal:** Build the main Pomodoro timer with countdown logic, controls, and stats.

**Files:**
- Create: `sproutdoro/src/scripts/timer.ts`
- Create: `sproutdoro/src/scripts/components/PlantCard.ts`
- Modify: `sproutdoro/index.html`

- [ ] **Step 1: Implement timer logic**

File: `sproutdoro/src/scripts/timer.ts`

```typescript
import { getSettings, saveSettings, createSession, getSettings as getStoredSettings } from './storage'
import type { Settings } from '../types'

interface TimerState {
  mode: 'work' | 'shortBreak' | 'longBreak'
  state: 'idle' | 'running' | 'paused' | 'complete'
  remainingSeconds: number
  totalSeconds: number
  sessionCount: number
}

class Timer {
  private state: TimerState
  private interval: ReturnType<typeof setInterval> | null = null
  private settings: Settings
  private onUpdate: (state: TimerState) => void
  private onComplete: (mode: string) => void
  
  constructor(
    settings: Settings,
    onUpdate: (state: TimerState) => void,
    onComplete: (mode: string) => void
  ) {
    this.settings = settings
    this.onUpdate = onUpdate
    this.onComplete = onComplete
    this.state = {
      mode: 'work',
      state: 'idle',
      remainingSeconds: settings.workDuration * 60,
      totalSeconds: settings.workDuration * 60,
      sessionCount: 0,
    }
  }
  
  start(): void {
    if (this.state.state === 'running') return
    
    this.state.state = 'running'
    this.tick()
    this.interval = setInterval(() => this.tick(), 1000)
    this.onUpdate({ ...this.state })
  }
  
  pause(): void {
    if (this.state.state !== 'running') return
    
    this.state.state = 'paused'
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.onUpdate({ ...this.state })
  }
  
  resume(): void {
    if (this.state.state !== 'paused') return
    
    this.state.state = 'running'
    this.interval = setInterval(() => this.tick(), 1000)
    this.onUpdate({ ...this.state })
  }
  
  reset(): void {
    this.stop()
    this.state.state = 'idle'
    this.state.remainingSeconds = this.getDurationForMode(this.state.mode)
    this.state.totalSeconds = this.state.remainingSeconds
    this.onUpdate({ ...this.state })
  }
  
  skip(): void {
    this.stop()
    this.transitionToNextMode()
    this.onUpdate({ ...this.state })
  }
  
  private tick(): void {
    this.state.remainingSeconds--
    
    if (this.state.remainingSeconds <= 0) {
      this.complete()
    } else {
      this.onUpdate({ ...this.state })
    }
  }
  
  private complete(): void {
    this.stop()
    this.state.state = 'complete'
    this.state.remainingSeconds = 0
    
    if (this.state.mode === 'work') {
      this.state.sessionCount++
    }
    
    this.onUpdate({ ...this.state })
    this.onComplete(this.state.mode)
    
    // Auto-transition after delay
    setTimeout(() => {
      this.transitionToNextMode()
    }, 2000)
  }
  
  private transitionToNextMode(): void {
    if (this.state.mode === 'work') {
      // After 4 work sessions, long break
      if (this.state.sessionCount % 4 === 0) {
        this.state.mode = 'longBreak'
        this.state.remainingSeconds = this.settings.longBreakDuration * 60
      } else {
        this.state.mode = 'shortBreak'
        this.state.remainingSeconds = this.settings.shortBreakDuration * 60
      }
    } else {
      this.state.mode = 'work'
      this.state.remainingSeconds = this.settings.workDuration * 60
    }
    
    this.state.totalSeconds = this.state.remainingSeconds
    this.state.state = 'idle'
    
    // Auto-start breaks if enabled
    if (this.settings.autoStartBreaks && (this.state.mode === 'shortBreak' || this.state.mode === 'longBreak')) {
      this.start()
    }
    
    this.onUpdate({ ...this.state })
  }
  
  private getDurationForMode(mode: string): number {
    switch (mode) {
      case 'work': return this.settings.workDuration * 60
      case 'shortBreak': return this.settings.shortBreakDuration * 60
      case 'longBreak': return this.settings.longBreakDuration * 60
      default: return this.settings.workDuration * 60
    }
  }
  
  private stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
  
  getState(): TimerState {
    return { ...this.state }
  }
}

export { Timer }
```

- [ ] **Step 2: Create PlantCard component**

File: `sproutdoro/src/scripts/components/PlantCard.ts`

```typescript
import type { Plant } from '../../types'

interface PlantCardProps {
  plant: Plant
  imageUrl?: string
  isFeatured?: boolean
}

const PLANT_IMAGES: Record<string, string> = {
  'fern': 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&h=400&fit=crop',
  'lavender': 'https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=400&h=400&fit=crop',
  'monstera': 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&h=400&fit=crop',
  'succulent': 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&h=400&fit=crop',
  'sunflower': 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&h=400&fit=crop',
  'bonsai': 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&h=400&fit=crop',
  'orchid': 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&h=400&fit=crop',
  'oak': 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&h=400&fit=crop',
}

export function createPlantCard(props: PlantCardProps): HTMLElement {
  const { plant, isFeatured = false } = props
  
  const imageUrl = PLANT_IMAGES[plant.type] || PLANT_IMAGES['fern']
  
  if (isFeatured) {
    const card = document.createElement('div')
    card.className = 'md:col-span-2 bg-surface-container-highest rounded-lg overflow-hidden relative flex flex-col md:flex-row'
    card.innerHTML = `
      <div class="md:w-1/2 h-64 md:h-auto overflow-hidden">
        <img src="${imageUrl}" alt="${plant.type}" class="w-full h-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy">
      </div>
      <div class="md:w-1/2 p-8 flex flex-col justify-center bg-gradient-to-br from-surface-container-highest to-surface-container-high">
        <div class="flex items-center gap-2 mb-4">
          <span class="material-symbols-outlined text-secondary-container" style="font-variation-settings: 'FILL' 1;">star</span>
          <span class="text-xs font-bold uppercase tracking-widest text-secondary font-label">Masterpiece</span>
        </div>
        <h3 class="text-3xl font-headline font-extrabold text-on-surface mb-2">${plant.type.charAt(0).toUpperCase() + plant.type.slice(1)}</h3>
        <p class="text-on-surface-variant mb-6 text-sm leading-relaxed">Grown during your focus sessions. A symbol of dedication and growth.</p>
        <div class="flex items-center justify-between border-t border-outline-variant/20 pt-6">
          <div>
            <p class="text-[10px] uppercase font-bold text-outline font-label">Grown on</p>
            <p class="font-bold text-primary">${new Date(plant.plantedAt).toLocaleDateString()}</p>
          </div>
          <button class="bg-surface-container-lowest text-primary px-6 py-2 rounded-full font-bold text-sm shadow-sm hover:bg-white transition-all">Details</button>
        </div>
      </div>
    `
    return card
  }
  
  const card = document.createElement('div')
  card.className = 'bg-surface-container-low rounded-lg p-6 group hover:bg-surface-container-high transition-all duration-300'
  
  const rarityColors = {
    common: 'bg-primary/10 text-primary',
    uncommon: 'bg-secondary/10 text-secondary',
    rare: 'bg-tertiary/10 text-tertiary',
    legendary: 'bg-secondary-fixed/30 text-on-secondary-fixed-variant',
  }
  
  const levelColors = ['bg-primary', 'bg-primary-container', 'bg-secondary', 'bg-secondary-container', 'bg-tertiary']
  const levelWidth = ['w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full']
  
  card.innerHTML = `
    <div class="aspect-square rounded-DEFAULT overflow-hidden mb-6 bg-primary-fixed/30 relative">
      <img src="${imageUrl}" alt="${plant.type}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy">
      <div class="absolute bottom-3 right-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold ${rarityColors[plant.rarity]}">${plant.rarity}</div>
    </div>
    <h4 class="text-xl font-headline font-bold text-on-surface mb-1">${plant.type.charAt(0).toUpperCase() + plant.type.slice(1)}</h4>
    <p class="text-xs text-outline mb-4">Grown: ${new Date(plant.plantedAt).toLocaleDateString()}</p>
    <div class="h-1 bg-surface-variant rounded-full overflow-hidden">
      <div class="h-full ${levelColors[plant.level - 1]} ${levelWidth[plant.level - 1]} rounded-full transition-all duration-500"></div>
    </div>
    <p class="text-[10px] mt-2 font-bold text-primary-container uppercase font-label">Level ${plant.level} Maturity</p>
  `
  
  return card
}
```

- [ ] **Step 3: Build index.html**

File: `sproutdoro/index.html`

```html
<!DOCTYPE html>
<html lang="en" class="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sproutdoro | Focus Timer</title>
  <link rel="stylesheet" href="./src/styles/main.css">
  <link rel="stylesheet" href="./src/styles/animations.css">
  <link rel="manifest" href="/manifest.json">
</head>
<body class="bg-surface font-body text-on-surface min-h-screen flex overflow-hidden">
  <!-- Decorative Background Elements -->
  <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-primary-fixed/30 rounded-full blur-[100px]"></div>
    <div class="absolute top-1/4 -right-20 w-[30rem] h-[30rem] bg-secondary-fixed/20 rounded-full blur-[120px]"></div>
    <div class="absolute -bottom-40 left-1/3 w-[40rem] h-[40rem] bg-tertiary-fixed/30 rounded-full blur-[150px]"></div>
  </div>

  <!-- SideNav -->
  <div id="side-nav-container"></div>

  <!-- Main Content Canvas -->
  <main class="flex-1 relative flex flex-col items-center justify-between p-6 md:px-12 md:py-10 z-10 min-h-screen">
    <!-- Top Header Area -->
    <header class="w-full max-w-5xl flex justify-between items-start pt-4 md:pt-0">
      <div class="flex flex-col gap-1">
        <span class="text-[0.65rem] font-bold font-label uppercase tracking-[0.15em] text-on-surface-variant/60">Current Season</span>
        <span class="text-lg md:text-xl font-headline font-semibold text-on-surface/90">Spring Morning</span>
      </div>
      <div class="flex flex-col items-end gap-1">
        <span class="text-[0.65rem] font-bold font-label uppercase tracking-[0.15em] text-on-surface-variant/60">Session Goal</span>
        <span class="text-lg md:text-xl font-headline font-semibold text-on-surface/90">Deep Focus (25m)</span>
      </div>
    </header>

    <!-- Center Stage: Timer & Plant -->
    <div class="relative w-full max-w-2xl flex flex-col items-center justify-center flex-1 my-8">
      <!-- Immersive Circular Timer -->
      <div class="relative w-[320px] h-[320px] md:w-[480px] md:h-[480px] flex items-center justify-center">
        <!-- Outer Glass Ring -->
        <div class="absolute inset-0 rounded-full timer-glass shadow-[0_0_40px_rgba(214,234,175,0.2)]"></div>
        
        <!-- SVG Timer -->
        <svg id="timer-svg" class="timer-svg w-full h-full absolute inset-0 overflow-visible pointer-events-none drop-shadow-sm" viewBox="0 0 480 480">
          <!-- Subtle Background Track -->
          <circle cx="240" cy="240" r="220" fill="transparent" stroke="currentColor" stroke-width="4" class="text-surface-variant/50"></circle>
          <!-- Thick Progress Track -->
          <circle cx="240" cy="240" r="220" fill="transparent" stroke="currentColor" stroke-width="16" class="text-primary/10"></circle>
          <!-- Active Progress Arc -->
          <circle id="progress-arc" cx="240" cy="240" r="220" fill="transparent" stroke="currentColor" stroke-dasharray="1382" stroke-dashoffset="1382" stroke-linecap="round" stroke-width="16" class="text-primary transition-all duration-1000 ease-linear"></circle>
          <!-- Glowing Indicator Dot -->
          <circle id="sun-dot" cx="460" cy="240" r="10" fill="#fd9e77" style="filter: drop-shadow(0 0 8px rgba(253, 158, 119, 0.6));"></circle>
          <circle id="inner-dot" cx="460" cy="240" r="4" fill="#fdf9ef"></circle>
        </svg>

        <!-- Integrated Center Content -->
        <div class="relative z-10 flex flex-col items-center justify-center w-full h-full">
          <!-- Sprout Image with Soft Fade -->
          <div class="absolute top-8 md:top-12 w-48 h-48 md:w-72 md:h-72 opacity-90 image-mask mix-blend-multiply">
            <div class="w-full h-full rounded-full bg-primary-fixed flex items-center justify-center">
              <span class="material-symbols-outlined text-primary text-8xl" style="font-variation-settings: 'FILL' 1;">psychiatry</span>
            </div>
          </div>
          <!-- Time Display -->
          <div class="text-center mt-32 md:mt-48 relative z-20 bg-surface/40 px-8 py-4 rounded-3xl backdrop-blur-md border border-surface/50 shadow-sm">
            <h2 id="time-display" class="text-7xl md:text-8xl font-headline font-bold tracking-tight text-on-surface leading-none tabular-nums" style="font-feature-settings: 'tnum';">
              25<span class="text-primary/70">:</span>00
            </h2>
            <p id="timer-label" class="text-xs font-label uppercase tracking-[0.25em] text-primary font-semibold mt-3">Remaining</p>
          </div>
        </div>
      </div>

      <!-- Refined Controls -->
      <div class="mt-12 md:mt-16 flex items-center justify-center gap-6 md:gap-8">
        <button id="btn-reset" class="w-14 h-14 rounded-full bg-surface-container/80 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary hover:shadow-md transition-all duration-200 border border-outline-variant/30 backdrop-blur-sm">
          <span class="material-symbols-outlined text-[1.5rem]">refresh</span>
        </button>
        <button id="btn-toggle" class="px-8 py-4 rounded-full bg-primary text-on-primary font-label text-base font-bold tracking-wide flex items-center gap-3 shadow-[0_8px_20px_rgba(81,98,51,0.25)] hover:shadow-[0_12px_28px_rgba(81,98,51,0.35)] hover:-translate-y-1 active:translate-y-0 active:shadow-md transition-all duration-300">
          <span id="toggle-icon" class="material-symbols-outlined text-[1.5rem]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
          <span id="toggle-text">Start</span>
        </button>
        <button id="btn-skip" class="w-14 h-14 rounded-full bg-surface-container/80 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary hover:shadow-md transition-all duration-200 border border-outline-variant/30 backdrop-blur-sm">
          <span class="material-symbols-outlined text-[1.5rem]">skip_next</span>
        </button>
      </div>
    </div>

    <!-- Elevated Session Stats -->
    <div id="stats-container" class="w-full max-w-5xl px-4 md:px-0 mb-20 md:mb-0">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <!-- Stats injected by JS -->
      </div>
    </div>
  </main>

  <!-- Mobile Navigation Fallback -->
  <div id="mobile-nav-container"></div>

  <script type="module" src="./src/scripts/timer.ts"></script>
</body>
</html>
```

- [ ] **Step 4: Implement timer page script**

File: `sproutdoro/src/scripts/timer.ts`

```typescript
import { Timer } from './timer'
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { createStatCard } from './components/StatCard'
import { getSettings, createSession } from './storage'

async function initTimerPage() {
  const settings = await getSettings()
  
  // Render navigation
  document.getElementById('side-nav-container')?.appendChild(createSideNav('focus'))
  document.getElementById('mobile-nav-container')?.appendChild(createMobileNav('focus'))
  
  // Render stats
  const statsContainer = document.querySelector('#stats-container .grid')
  if (statsContainer) {
    statsContainer.appendChild(createStatCard({
      icon: 'energy_savings_leaf',
      iconBg: 'bg-secondary-container/30',
      iconColor: 'text-secondary',
      label: 'Session Sprout',
      value: 'Fern Leaf',
      delay: 0,
    }))
    statsContainer.appendChild(createStatCard({
      icon: 'water_drop',
      iconBg: 'bg-primary-container/20',
      iconColor: 'text-primary',
      label: 'Hydration',
      value: 'Optimal',
      delay: 100,
    }))
    statsContainer.appendChild(createStatCard({
      icon: 'hourglass_empty',
      iconBg: 'bg-tertiary-container/20',
      iconColor: 'text-tertiary',
      label: "Today's Focus",
      value: '0.0 Hours',
      delay: 200,
    }))
    statsContainer.appendChild(createStatCard({
      icon: 'sunny',
      iconBg: 'bg-secondary-fixed/50',
      iconColor: 'text-secondary',
      label: 'Growth Stage',
      value: 'Sprouting',
      delay: 300,
    }))
  }
  
  // Timer elements
  const timeDisplay = document.getElementById('time-display')
  const timerLabel = document.getElementById('timer-label')
  const progressArc = document.getElementById('progress-arc') as SVGCircleElement
  const sunDot = document.getElementById('sun-dot') as SVGCircleElement
  const innerDot = document.getElementById('inner-dot') as SVGCircleElement
  const btnToggle = document.getElementById('btn-toggle')
  const toggleIcon = document.getElementById('toggle-icon')
  const toggleText = document.getElementById('toggle-text')
  const btnReset = document.getElementById('btn-reset')
  const btnSkip = document.getElementById('btn-skip')
  
  const circumference = 2 * Math.PI * 220
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}<span class="text-primary/70">:</span>${secs.toString().padStart(2, '0')}`
  }
  
  function updateDisplay(state: any) {
    if (timeDisplay) {
      timeDisplay.innerHTML = formatTime(state.remainingSeconds)
    }
    
    if (timerLabel) {
      const labels: Record<string, string> = {
        work: 'Remaining',
        shortBreak: 'Short Break',
        longBreak: 'Long Break',
      }
      timerLabel.textContent = labels[state.mode] || 'Remaining'
    }
    
    // Update progress ring
    const progress = state.totalSeconds > 0 ? (state.totalSeconds - state.remainingSeconds) / state.totalSeconds : 0
    const offset = circumference * (1 - progress)
    
    if (progressArc) {
      progressArc.setAttribute('stroke-dashoffset', String(offset))
    }
    
    // Update sun dot position
    const angle = (progress * 360 - 90) * (Math.PI / 180)
    const centerX = 240
    const centerY = 240
    const radius = 220
    const dotX = centerX + radius * Math.cos(angle)
    const dotY = centerY + radius * Math.sin(angle)
    
    if (sunDot) {
      sunDot.setAttribute('cx', String(dotX))
      sunDot.setAttribute('cy', String(dotY))
    }
    if (innerDot) {
      innerDot.setAttribute('cx', String(dotX))
      innerDot.setAttribute('cy', String(dotY))
    }
    
    // Update button
    if (toggleIcon && toggleText) {
      if (state.state === 'running') {
        toggleIcon.textContent = 'pause'
        toggleText.textContent = 'Pause'
      } else if (state.state === 'paused') {
        toggleIcon.textContent = 'play_arrow'
        toggleText.textContent = 'Resume'
      } else {
        toggleIcon.textContent = 'play_arrow'
        toggleText.textContent = 'Start'
      }
    }
  }
  
  async function handleComplete(mode: string) {
    console.log('Session complete:', mode)
    
    if (mode === 'work') {
      // Create session record
      const session = {
        id: crypto.randomUUID(),
        startTime: Date.now() - settings.workDuration * 60 * 1000,
        endTime: Date.now(),
        duration: settings.workDuration,
        type: 'work' as const,
        plantId: null,
        category: 'deep-work',
        completed: true,
      }
      
      await createSession(session)
      
      // Show notification if enabled
      if (settings.notifications && 'Notification' in window) {
        new Notification('Sproutdoro', {
          body: 'Focus session complete! Your sprout is ready.',
          icon: '/icons/icon-192x192.png',
        })
      }
    }
  }
  
  const timer = new Timer(settings, updateDisplay, handleComplete)
  
  // Initialize display
  updateDisplay(timer.getState())
  
  // Event listeners
  btnToggle?.addEventListener('click', () => {
    const state = timer.getState()
    if (state.state === 'running') {
      timer.pause()
    } else if (state.state === 'paused') {
      timer.resume()
    } else {
      timer.start()
    }
  })
  
  btnReset?.addEventListener('click', () => {
    timer.reset()
  })
  
  btnSkip?.addEventListener('click', () => {
    timer.skip()
  })
}

initTimerPage().catch(console.error)
```

- [ ] **Step 5: Test timer page**

Run: `cd sproutdoro && npm run dev`
Open: `http://localhost:5173/`
Expected:
- Timer displays 25:00
- Click Start → timer counts down, progress ring fills
- Click Pause → timer stops
- Click Resume → timer continues
- At 00:00 → "Session complete" logged, notification shown

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: implement focus timer page with countdown, controls, and stats"
git push -u origin feature/timer-page
gh pr create --title "feat: add focus timer page" --body "Implements the main Pomodoro timer with circular progress, start/pause/resume/skip controls, and session stats. Includes timer logic and page integration." --base main
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

---

## Task 5: Settings Page

**Branch:** `feature/settings-page`

**Goal:** Build settings page with sliders, toggles, sound picker, and theme switch.

**Files:**
- Create: `sproutdoro/src/scripts/settings.ts`
- Create: `sproutdoro/src/scripts/components/RangeSlider.ts`
- Create: `sproutdoro/src/scripts/components/ToggleSwitch.ts`
- Create: `sproutdoro/src/scripts/components/SoundCard.ts`
- Modify: `sproutdoro/settings.html`

- [ ] **Step 1: Implement RangeSlider**

File: `sproutdoro/src/scripts/components/RangeSlider.ts`

```typescript
interface RangeSliderProps {
  label: string
  value: number
  min: number
  max: number
  accentColor: string
  onChange: (value: number) => void
}

export function createRangeSlider(props: RangeSliderProps): HTMLElement {
  const { label, value, min, max, accentColor, onChange } = props
  
  const container = document.createElement('div')
  container.className = 'space-y-4'
  
  const header = document.createElement('div')
  header.className = 'flex justify-between items-end'
  header.innerHTML = `
    <label class="text-sm font-bold uppercase tracking-widest font-headline text-on-surface-variant">${label}</label>
    <span class="text-2xl font-bold font-headline text-${accentColor}">${value.toString().padStart(2, '0')}:00</span>
  `
  
  const input = document.createElement('input')
  input.type = 'range'
  input.min = String(min)
  input.max = String(max)
  input.value = String(value)
  input.className = `w-full h-2 rounded-full accent-${accentColor}`
  
  // Custom styling for range input
  input.style.cssText = `
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  `
  
  input.addEventListener('input', (e) => {
    const newValue = parseInt((e.target as HTMLInputElement).value)
    const display = header.querySelector('span:last-child')
    if (display) {
      display.textContent = `${newValue.toString().padStart(2, '0')}:00`
    }
    onChange(newValue)
  })
  
  container.appendChild(header)
  container.appendChild(input)
  
  return container
}
```

- [ ] **Step 2: Implement ToggleSwitch**

File: `sproutdoro/src/scripts/components/ToggleSwitch.ts`

```typescript
interface ToggleSwitchProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function createToggleSwitch(props: ToggleSwitchProps): HTMLElement {
  const { label, description, checked, onChange } = props
  
  const container = document.createElement('div')
  container.className = 'flex items-center justify-between bg-surface-container-low p-6 rounded-lg'
  
  const left = document.createElement('div')
  left.className = 'flex gap-4 items-center'
  left.innerHTML = `
    <div>
      <p class="font-bold font-headline">${label}</p>
      <p class="text-sm text-on-surface-variant">${description}</p>
    </div>
  `
  
  const toggle = document.createElement('button')
  toggle.className = `w-14 h-8 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-outline-variant/30'}`
  toggle.setAttribute('role', 'switch')
  toggle.setAttribute('aria-checked', String(checked))
  
  const circle = document.createElement('div')
  circle.className = 'absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform'
  circle.style.left = checked ? 'calc(100% - 28px)' : '4px'
  
  toggle.appendChild(circle)
  
  toggle.addEventListener('click', () => {
    const newChecked = !checked
    toggle.className = `w-14 h-8 rounded-full relative transition-colors ${newChecked ? 'bg-primary' : 'bg-outline-variant/30'}`
    circle.style.left = newChecked ? 'calc(100% - 28px)' : '4px'
    toggle.setAttribute('aria-checked', String(newChecked))
    onChange(newChecked)
  })
  
  container.appendChild(left)
  container.appendChild(toggle)
  
  return container
}
```

- [ ] **Step 3: Implement SoundCard**

File: `sproutdoro/src/scripts/components/SoundCard.ts`

```typescript
interface SoundCardProps {
  icon: string
  name: string
  description: string
  selected: boolean
  accentColor: string
  onSelect: () => void
}

export function createSoundCard(props: SoundCardProps): HTMLElement {
  const { icon, name, description, selected, accentColor, onSelect } = props
  
  const card = document.createElement('div')
  card.className = `bg-surface-container-lowest p-6 rounded-lg group cursor-pointer hover:bg-${accentColor}-fixed transition-colors`
  if (selected) {
    card.classList.add('ring-2', 'ring-primary')
  }
  
  card.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <span class="material-symbols-outlined text-${accentColor} group-hover:scale-110 transition-transform">${icon}</span>
      <div class="w-5 h-5 rounded-full border-2 ${selected ? 'border-primary' : 'border-outline-variant'} flex items-center justify-center">
        ${selected ? '<div class="w-2.5 h-2.5 bg-primary rounded-full"></div>' : ''}
      </div>
    </div>
    <p class="font-bold font-headline">${name}</p>
    <p class="text-xs text-on-surface-variant mt-1">${description}</p>
  `
  
  card.addEventListener('click', onSelect)
  
  return card
}
```

- [ ] **Step 4: Build settings.html**

File: `sproutdoro/settings.html`

```html
<!DOCTYPE html>
<html lang="en" class="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sproutdoro Settings</title>
  <link rel="stylesheet" href="./src/styles/main.css">
  <link rel="stylesheet" href="./src/styles/animations.css">
  <link rel="manifest" href="/manifest.json">
</head>
<body class="bg-surface text-on-surface min-h-screen flex">
  <!-- SideNav -->
  <div id="side-nav-container"></div>

  <!-- Main Canvas -->
  <main class="flex-1 min-h-screen px-6 py-12 md:px-16 md:py-20 max-w-5xl mx-auto">
    <header class="mb-12">
      <div class="flex items-center gap-4 mb-2">
        <span class="material-symbols-outlined text-secondary" style="font-variation-settings: 'FILL' 1;">settings</span>
        <h2 class="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Settings</h2>
      </div>
      <p class="text-on-surface-variant max-w-md">Tailor your greenhouse environment for maximum focus and growth.</p>
    </header>

    <!-- Bento Layout for Settings -->
    <div id="settings-grid" class="grid grid-cols-1 md:grid-cols-12 gap-8">
      <!-- Timer Durations Card -->
      <section id="timer-durations" class="md:col-span-8 bg-surface-container-low p-8 rounded-lg">
        <div class="flex items-center gap-3 mb-8">
          <span class="material-symbols-outlined text-primary">schedule</span>
          <h3 class="text-xl font-bold font-headline">Timer Durations</h3>
        </div>
        <div id="sliders-container" class="space-y-10"></div>
      </section>

      <!-- Theme Toggle Card -->
      <section class="md:col-span-4 bg-surface-container-highest p-8 rounded-lg flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <span class="material-symbols-outlined text-secondary">palette</span>
            <h3 class="text-xl font-bold font-headline">Appearance</h3>
          </div>
          <p class="text-sm text-on-surface-variant mb-8 leading-relaxed">Choose an environment that matches your current sunlight levels.</p>
        </div>
        <div id="theme-toggle" class="bg-surface-container-lowest p-2 rounded-full flex gap-1"></div>
      </section>

      <!-- Notification Sounds Card -->
      <section class="md:col-span-12 bg-surface-container-low p-8 rounded-lg">
        <div class="flex items-center gap-3 mb-8">
          <span class="material-symbols-outlined text-primary">volume_up</span>
          <h3 class="text-xl font-bold font-headline">Ambience & Alerts</h3>
        </div>
        <div id="sound-options" class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
        <div id="volume-control" class="mt-8 flex items-center gap-6 bg-surface-container p-4 rounded-full"></div>
      </section>

      <!-- Extra Toggles -->
      <section id="toggles" class="md:col-span-12 space-y-4"></section>
    </div>

    <footer class="mt-16 flex flex-col md:flex-row gap-4 items-center justify-between pt-8 border-t border-outline-variant/10">
      <p class="text-xs text-on-surface-variant uppercase tracking-widest font-headline">Sproutdoro v2.4.0 — Made with care</p>
      <div class="flex gap-6">
        <button id="btn-reset" class="text-sm font-bold text-primary hover:underline underline-offset-4">Reset Defaults</button>
        <button id="btn-save" class="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Save Changes</button>
      </div>
    </footer>
  </main>

  <!-- Mobile Navigation -->
  <div id="mobile-nav-container"></div>

  <script type="module" src="./src/scripts/settings.ts"></script>
</body>
</html>
```

- [ ] **Step 5: Implement settings page script**

File: `sproutdoro/src/scripts/settings.ts`

```typescript
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { createRangeSlider } from './components/RangeSlider'
import { createToggleSwitch } from './components/ToggleSwitch'
import { createSoundCard } from './components/SoundCard'
import { getSettings, saveSettings, DEFAULT_SETTINGS } from './storage'
import type { Settings } from '../types'

async function initSettingsPage() {
  const settings = await getSettings()
  
  // Render navigation
  document.getElementById('side-nav-container')?.appendChild(createSideNav('config'))
  document.getElementById('mobile-nav-container')?.appendChild(createMobileNav('config'))
  
  // Render sliders
  const slidersContainer = document.getElementById('sliders-container')
  if (slidersContainer) {
    slidersContainer.appendChild(createRangeSlider({
      label: 'Work Session',
      value: settings.workDuration,
      min: 1,
      max: 60,
      accentColor: 'primary',
      onChange: (value) => {
        settings.workDuration = value
        saveSettings(settings)
      },
    }))
    
    slidersContainer.appendChild(createRangeSlider({
      label: 'Short Break',
      value: settings.shortBreakDuration,
      min: 1,
      max: 15,
      accentColor: 'secondary',
      onChange: (value) => {
        settings.shortBreakDuration = value
        saveSettings(settings)
      },
    }))
    
    slidersContainer.appendChild(createRangeSlider({
      label: 'Long Break',
      value: settings.longBreakDuration,
      min: 5,
      max: 45,
      accentColor: 'tertiary',
      onChange: (value) => {
        settings.longBreakDuration = value
        saveSettings(settings)
      },
    }))
  }
  
  // Render theme toggle
  const themeToggle = document.getElementById('theme-toggle')
  if (themeToggle) {
    const lightBtn = document.createElement('button')
    lightBtn.className = `flex-1 py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all ${
      settings.theme === 'light' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant'
    }`
    lightBtn.innerHTML = `
      <span class="material-symbols-outlined text-sm">light_mode</span>
      <span class="text-xs font-bold uppercase tracking-wider font-headline">Light</span>
    `
    lightBtn.addEventListener('click', () => {
      settings.theme = 'light'
      saveSettings(settings)
      updateThemeButtons()
    })
    
    const darkBtn = document.createElement('button')
    darkBtn.className = `flex-1 py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all ${
      settings.theme === 'dark' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant'
    }`
    darkBtn.innerHTML = `
      <span class="material-symbols-outlined text-sm">dark_mode</span>
      <span class="text-xs font-bold uppercase tracking-wider font-headline">Dark</span>
    `
    darkBtn.addEventListener('click', () => {
      settings.theme = 'dark'
      saveSettings(settings)
      updateThemeButtons()
    })
    
    themeToggle.appendChild(lightBtn)
    themeToggle.appendChild(darkBtn)
    
    function updateThemeButtons() {
      lightBtn.className = `flex-1 py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all ${
        settings.theme === 'light' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant'
      }`
      darkBtn.className = `flex-1 py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all ${
        settings.theme === 'dark' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant'
      }`
    }
  }
  
  // Render sound options
  const soundOptions = document.getElementById('sound-options')
  if (soundOptions) {
    const sounds = [
      { icon: 'air', name: 'Soft Wind Chimes', description: 'A gentle reminder of peace', value: 'wind-chimes', color: 'primary' },
      { icon: 'eco', name: 'Birdsong Morning', description: "Nature's natural wake-up", value: 'birdsong', color: 'secondary' },
      { icon: 'water_drop', name: 'Rain on Leaves', description: 'Deep focus in the mist', value: 'rain', color: 'tertiary' },
    ]
    
    sounds.forEach(sound => {
      soundOptions.appendChild(createSoundCard({
        icon: sound.icon,
        name: sound.name,
        description: sound.description,
        selected: settings.sound === sound.value,
        accentColor: sound.color,
        onSelect: () => {
          settings.sound = sound.value as any
          saveSettings(settings)
          // Re-render to update selection visuals
          soundOptions.innerHTML = ''
          sounds.forEach(s => {
            soundOptions.appendChild(createSoundCard({
              icon: s.icon,
              name: s.name,
              description: s.description,
              selected: settings.sound === s.value,
              accentColor: s.color,
              onSelect: () => {
                settings.sound = s.value as any
                saveSettings(settings)
              },
            }))
          })
        },
      }))
    })
  }
  
  // Render volume control
  const volumeControl = document.getElementById('volume-control')
  if (volumeControl) {
    volumeControl.innerHTML = `
      <span class="material-symbols-outlined text-on-surface-variant">volume_down</span>
      <input type="range" min="0" max="100" value="${settings.volume}" class="flex-1 accent-primary" id="volume-slider">
      <span class="material-symbols-outlined text-on-surface-variant">volume_up</span>
    `
    
    const slider = document.getElementById('volume-slider') as HTMLInputElement
    slider?.addEventListener('input', (e) => {
      settings.volume = parseInt((e.target as HTMLInputElement).value)
      saveSettings(settings)
    })
  }
  
  // Render toggles
  const toggles = document.getElementById('toggles')
  if (toggles) {
    toggles.appendChild(createToggleSwitch({
      label: 'Auto-start Breaks',
      description: "Don't wait, keep the cycle growing.",
      checked: settings.autoStartBreaks,
      onChange: (checked) => {
        settings.autoStartBreaks = checked
        saveSettings(settings)
      },
    }))
    
    toggles.appendChild(createToggleSwitch({
      label: 'Browser Notifications',
      description: 'Alerts when your sprout is ready.',
      checked: settings.notifications,
      onChange: (checked) => {
        settings.notifications = checked
        saveSettings(settings)
      },
    }))
  }
  
  // Reset defaults
  document.getElementById('btn-reset')?.addEventListener('click', async () => {
    if (confirm('Reset all settings to defaults?')) {
      await saveSettings(DEFAULT_SETTINGS)
      window.location.reload()
    }
  })
  
  // Save button (visual confirmation)
  document.getElementById('btn-save')?.addEventListener('click', () => {
    saveSettings(settings)
    alert('Settings saved successfully!')
  })
}

initSettingsPage().catch(console.error)
```

- [ ] **Step 6: Test settings page**

Run: `cd sproutdoro && npm run dev`
Open: `http://localhost:5173/settings.html`
Expected:
- All sliders show correct default values
- Changing sliders updates displayed time
- Theme toggle switches between Light/Dark
- Sound cards highlight selection
- Volume slider works
- Toggles switch ON/OFF
- Reset Defaults restores all defaults

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: implement settings page with timer durations, theme, sounds, and toggles"
git push -u origin feature/settings-page
gh pr create --title "feat: add settings page" --body "Implements settings page with bento grid layout, timer duration sliders, theme toggle, sound picker, volume control, and feature toggles. All changes persist to IndexedDB." --base main
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

---

## Task 6: Garden Page

**Branch:** `feature/garden-page`

**Goal:** Build plant collection gallery with rarity badges, maturity levels, and featured plant.

**Files:**
- Create: `sproutdoro/src/scripts/garden.ts`
- Modify: `sproutdoro/garden.html`

- [ ] **Step 1: Build garden.html**

File: `sproutdoro/garden.html`

```html
<!DOCTYPE html>
<html lang="en" class="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sproutdoro | My Garden</title>
  <link rel="stylesheet" href="./src/styles/main.css">
  <link rel="stylesheet" href="./src/styles/animations.css">
  <link rel="manifest" href="/manifest.json">
</head>
<body class="bg-surface font-body text-on-surface min-h-screen flex">
  <!-- SideNav -->
  <div id="side-nav-container"></div>

  <main class="flex-1 px-8 lg:px-16 py-12 max-w-7xl mx-auto">
    <!-- Header Section -->
    <header class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-2">
        <span class="inline-block px-4 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full text-xs font-bold tracking-widest uppercase font-label">Trophy Room</span>
        <h2 class="text-5xl font-headline font-extrabold text-primary tracking-tight">My Garden</h2>
        <p class="text-on-surface-variant max-w-md text-lg">Your focus is the sun that nurtures these seedlings into life. Every plant tells a story of dedicated time.</p>
      </div>
      <div class="flex gap-3">
        <div class="bg-surface-container-low px-6 py-4 rounded-xl flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
            <span class="material-symbols-outlined text-primary">eco</span>
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold text-outline tracking-wider font-label">Total Plants</p>
            <p id="total-plants" class="text-2xl font-headline font-extrabold text-primary">0</p>
          </div>
        </div>
        <div class="bg-surface-container-low px-6 py-4 rounded-xl flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center">
            <span class="material-symbols-outlined text-secondary">schedule</span>
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold text-outline tracking-wider font-label">Focus Hours</p>
            <p id="focus-hours" class="text-2xl font-headline font-extrabold text-secondary">0</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Featured Plant -->
    <div id="featured-plant" class="mb-8"></div>

    <!-- Plant Grid -->
    <section id="plant-grid" class="garden-grid"></section>
  </main>

  <!-- Floating Action Button -->
  <div class="fixed bottom-10 right-10 z-50">
    <button id="fab-new-sprout" class="flex items-center gap-3 bg-primary text-on-primary px-8 py-4 rounded-full shadow-[0px_12px_32px_rgba(147,74,41,0.08)] hover:scale-105 transition-transform duration-200">
      <span class="material-symbols-outlined">temp_preferences_custom</span>
      <span class="font-headline font-bold">New Sprout</span>
    </button>
  </div>

  <!-- Mobile Navigation -->
  <div id="mobile-nav-container"></div>

  <script type="module" src="./src/scripts/garden.ts"></script>
</body>
</html>
```

- [ ] **Step 2: Implement garden page script**

File: `sproutdoro/src/scripts/garden.ts`

```typescript
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { createPlantCard } from './components/PlantCard'
import { getAllPlants, getFeaturedPlant } from './storage'

async function initGardenPage() {
  // Render navigation
  document.getElementById('side-nav-container')?.appendChild(createSideNav('garden'))
  document.getElementById('mobile-nav-container')?.appendChild(createMobileNav('garden'))
  
  // Load plants
  const plants = await getAllPlants()
  const featuredPlant = await getFeaturedPlant()
  
  // Update stats
  const totalPlantsEl = document.getElementById('total-plants')
  const focusHoursEl = document.getElementById('focus-hours')
  
  if (totalPlantsEl) {
    totalPlantsEl.textContent = String(plants.length)
  }
  
  if (focusHoursEl) {
    const totalMinutes = plants.reduce((sum, p) => sum + p.totalFocusMinutes, 0)
    focusHoursEl.textContent = (totalMinutes / 60).toFixed(1)
  }
  
  // Render featured plant
  const featuredContainer = document.getElementById('featured-plant')
  if (featuredContainer && featuredPlant) {
    featuredContainer.appendChild(createPlantCard({
      plant: featuredPlant,
      isFeatured: true,
    }))
  }
  
  // Render plant grid
  const grid = document.getElementById('plant-grid')
  if (grid) {
    plants.forEach(plant => {
      grid.appendChild(createPlantCard({ plant }))
    })
    
    // Add empty slot CTA
    const emptySlot = document.createElement('div')
    emptySlot.className = 'bg-secondary-fixed rounded-lg p-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-secondary/20 group cursor-pointer hover:bg-secondary-container/30 transition-all'
    emptySlot.innerHTML = `
      <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 text-secondary shadow-md group-hover:scale-110 transition-transform">
        <span class="material-symbols-outlined text-4xl">add_circle</span>
      </div>
      <h4 class="text-xl font-headline font-bold text-on-secondary-fixed mb-1">New Seedling</h4>
      <p class="text-xs text-on-secondary-fixed-variant max-w-[150px]">Start a focus session to plant a new memory.</p>
    `
    emptySlot.addEventListener('click', () => {
      window.location.href = './index.html'
    })
    grid.appendChild(emptySlot)
  }
  
  // FAB click handler
  document.getElementById('fab-new-sprout')?.addEventListener('click', () => {
    window.location.href = './index.html'
  })
}

initGardenPage().catch(console.error)
```

- [ ] **Step 3: Add garden-grid CSS**

File: `sproutdoro/src/styles/components.css`

```css
@layer components {
  .garden-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
  }
}
```

- [ ] **Step 4: Test garden page**

Run: `cd sproutdoro && npm run dev`
Open: `http://localhost:5173/garden.html`
Expected:
- Shows plant grid (empty initially or with test data)
- Stats show correct counts
- Featured plant displayed prominently
- Empty slot CTA visible
- FAB navigates to timer page

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement garden page with plant collection, rarity badges, and maturity levels"
git push -u origin feature/garden-page
gh pr create --title "feat: add garden page" --body "Implements My Garden page with plant collection grid, featured plant showcase, rarity badges, maturity progress bars, and empty slot CTA." --base main
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

---

## Task 7: Insights Page

**Branch:** `feature/insights-page`

**Goal:** Build analytics page with streaks, bar charts, pie charts, and achievements.

**Files:**
- Create: `sproutdoro/src/scripts/insights.ts`
- Modify: `sproutdoro/insights.html`

- [ ] **Step 1: Build insights.html**

File: `sproutdoro/insights.html`

```html
<!DOCTYPE html>
<html lang="en" class="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Focus Insights - Sproutdoro</title>
  <link rel="stylesheet" href="./src/styles/main.css">
  <link rel="stylesheet" href="./src/styles/animations.css">
  <link rel="manifest" href="/manifest.json">
</head>
<body class="bg-surface text-on-surface selection:bg-primary-fixed-dim">
  <div class="flex min-h-screen">
    <!-- SideNav -->
    <div id="side-nav-container"></div>

    <!-- Main Content Canvas -->
    <main class="flex-1 px-6 md:px-12 py-10 max-w-6xl mx-auto w-full">
      <!-- Header Section -->
      <header class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-2">
          <h2 class="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface">Focus Insights</h2>
          <p class="text-on-surface-variant text-lg">Your productivity, blossoming beautifully.</p>
        </div>
        <div class="flex items-center gap-4 bg-surface-container-low px-6 py-3 rounded-full border border-outline-variant/10">
          <div class="flex -space-x-2">
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs border-2 border-surface">
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">eco</span>
            </div>
            <div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs border-2 border-surface">
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">wb_sunny</span>
            </div>
          </div>
          <span id="gardener-level" class="text-sm font-label font-bold text-primary">Level 1 Gardener</span>
        </div>
      </header>

      <!-- Bento Grid Layout -->
      <div id="insights-grid" class="grid grid-cols-1 md:grid-cols-12 gap-6">
        <!-- Hero Stat: Daily Streak -->
        <div id="streak-card" class="md:col-span-4 bg-secondary-fixed rounded-lg p-8 flex flex-col justify-between relative overflow-hidden group"></div>

        <!-- Plants Grown Visualization -->
        <div id="bar-chart" class="md:col-span-8 bg-surface-container-low rounded-lg p-8"></div>

        <!-- Distribution Pie Chart -->
        <div id="pie-chart" class="md:col-span-7 bg-surface-container-low rounded-lg p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center"></div>

        <!-- Total Focus Hours -->
        <div id="total-focus" class="md:col-span-5 bg-tertiary-fixed rounded-lg p-8 flex flex-col justify-between"></div>

        <!-- Gardening Achievements -->
        <div id="achievements" class="md:col-span-12 bg-surface-container rounded-xl p-8 overflow-hidden relative"></div>
      </div>

      <!-- Footer-style Encouragement -->
      <footer class="mt-16 text-center space-y-4">
        <div class="inline-flex items-center gap-2 text-primary/60 font-medium">
          <span class="material-symbols-outlined text-sm">auto_awesome</span>
          <span>Growth isn't always visible, but it's always happening.</span>
        </div>
      </footer>
    </main>
  </div>

  <!-- Mobile Navigation Bar -->
  <div id="mobile-nav-container"></div>

  <script type="module" src="./src/scripts/insights.ts"></script>
</body>
</html>
```

- [ ] **Step 2: Implement insights page script**

File: `sproutdoro/src/scripts/insights.ts`

```typescript
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { getInsights, getAllPlants, getSessions } from './storage'

async function initInsightsPage() {
  // Render navigation
  document.getElementById('side-nav-container')?.appendChild(createSideNav('insights'))
  document.getElementById('mobile-nav-container')?.appendChild(createMobileNav('insights'))
  
  // Load data
  const insights = await getInsights()
  const plants = await getAllPlants()
  const sessions = await getSessions()
  
  // Update gardener level
  const levelEl = document.getElementById('gardener-level')
  if (levelEl) {
    const hours = Math.floor(insights.dailyStats.reduce((sum, d) => sum + d.totalFocusMinutes, 0) / 60)
    const level = Math.min(Math.floor(hours / 10) + 1, 20)
    levelEl.textContent = `Level ${level} Gardener`
  }
  
  // Render streak card
  const streakCard = document.getElementById('streak-card')
  if (streakCard) {
    streakCard.innerHTML = `
      <div class="z-10">
        <span class="text-on-secondary-fixed-variant font-label text-xs uppercase tracking-widest font-bold">Daily Streak</span>
        <div class="mt-4 flex items-baseline gap-2">
          <h3 class="text-7xl font-headline font-extrabold text-on-secondary-fixed">${insights.currentStreak}</h3>
          <span class="text-xl font-headline font-bold text-on-secondary-fixed-variant">Days</span>
        </div>
      </div>
      <p class="mt-4 text-on-secondary-fixed-variant/80 text-sm leading-relaxed z-10">${
        insights.currentStreak > 0 
          ? "You're on fire! Keep nurturing your habits to reach a 21-day sprout." 
          : 'Start your first session today to begin your streak!'
      }</p>
      <span class="material-symbols-outlined absolute -right-4 -bottom-4 text-[12rem] text-secondary/10 group-hover:rotate-12 transition-transform duration-700">local_fire_department</span>
    `
  }
  
  // Render bar chart
  const barChart = document.getElementById('bar-chart')
  if (barChart) {
    const last7Days = insights.dailyStats.slice(-7)
    const maxValue = Math.max(...last7Days.map(d => d.plantsGrown), 1)
    
    barChart.innerHTML = `
      <div class="flex items-center justify-between mb-8">
        <div>
          <h4 class="text-xl font-headline font-bold">Plants Grown</h4>
          <p class="text-sm text-on-surface-variant">Focus milestones reached this week</p>
        </div>
        <div class="bg-surface-container-lowest p-2 rounded-xl flex gap-2">
          <button class="px-3 py-1 text-xs font-bold rounded-lg bg-primary text-white">Wk</button>
          <button class="px-3 py-1 text-xs font-bold rounded-lg hover:bg-surface-variant transition-colors">Mo</button>
        </div>
      </div>
      <div class="flex items-end justify-between h-48 gap-3">
        ${last7Days.map((day, i) => {
          const height = day.plantsGrown > 0 ? (day.plantsGrown / maxValue * 100) : 5
          const colors = ['bg-primary-fixed-dim', 'bg-primary-container', 'bg-primary', 'bg-primary-fixed-dim', 'bg-primary-container', 'bg-primary-fixed', 'bg-primary-fixed-dim']
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const dayName = dayNames[new Date(day.date).getDay()]
          
          return `
            <div class="flex-1 flex flex-col items-center gap-3 group">
              <div class="w-full ${colors[i % colors.length]} rounded-t-full transition-all duration-500 relative" style="height: ${height}%"></div>
              <span class="text-xs font-label text-on-surface-variant font-bold">${dayName}</span>
            </div>
          `
        }).join('')}
      </div>
    `
  }
  
  // Render pie chart
  const pieChart = document.getElementById('pie-chart')
  if (pieChart) {
    const totalHours = Math.floor(insights.dailyStats.reduce((sum, d) => sum + d.totalFocusMinutes, 0) / 60)
    
    pieChart.innerHTML = `
      <div class="relative flex items-center justify-center">
        <svg class="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" fill="none" r="40" stroke="#ece8de" stroke-width="12"></circle>
          <circle cx="50" cy="50" fill="none" r="40" stroke="#516233" stroke-dasharray="160 251" stroke-width="12"></circle>
          <circle cx="50" cy="50" fill="none" r="40" stroke="#934a29" stroke-dasharray="60 251" stroke-dashoffset="-160" stroke-width="12"></circle>
          <circle cx="50" cy="50" fill="none" r="40" stroke="#fd9e77" stroke-dasharray="31 251" stroke-dashoffset="-220" stroke-width="12"></circle>
        </svg>
        <div class="absolute flex flex-col items-center">
          <span class="text-2xl font-headline font-bold">${totalHours}h</span>
          <span class="text-[10px] uppercase font-label font-bold text-on-surface-variant">Total</span>
        </div>
      </div>
      <div class="space-y-4">
        <h4 class="text-xl font-headline font-bold">Focus Distribution</h4>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-primary"></div>
              <span class="text-sm font-medium">Deep Work</span>
            </div>
            <span class="text-sm font-bold">65%</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-secondary"></div>
              <span class="text-sm font-medium">Reading</span>
            </div>
            <span class="text-sm font-bold">24%</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-secondary-container"></div>
              <span class="text-sm font-medium">Planning</span>
            </div>
            <span class="text-sm font-bold">11%</span>
          </div>
        </div>
      </div>
    `
  }
  
  // Render total focus hours
  const totalFocus = document.getElementById('total-focus')
  if (totalFocus) {
    const totalHours = Math.floor(insights.dailyStats.reduce((sum, d) => sum + d.totalFocusMinutes, 0) / 60)
    const progress = Math.min((totalHours / insights.monthlyGoalHours) * 100, 100)
    
    totalFocus.innerHTML = `
      <div>
        <div class="flex items-center justify-between">
          <h4 class="text-on-tertiary-fixed font-headline font-bold text-xl">Total Focus</h4>
          <span class="material-symbols-outlined text-on-tertiary-fixed-variant">schedule</span>
        </div>
        <div class="mt-4 flex items-baseline gap-2">
          <h3 class="text-6xl font-headline font-extrabold text-on-tertiary-fixed">${totalHours}</h3>
          <span class="text-xl font-headline font-bold text-on-tertiary-fixed-variant">Hours</span>
        </div>
      </div>
      <div class="mt-8 pt-6 border-t border-on-tertiary-fixed-variant/10">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-on-tertiary-fixed-variant font-medium">Monthly Goal</span>
          <span class="text-sm text-on-tertiary-fixed font-bold">${Math.round(progress)}%</span>
        </div>
        <div class="w-full bg-tertiary-fixed-dim/30 h-3 rounded-full overflow-hidden">
          <div class="bg-tertiary h-full rounded-full transition-all duration-1000" style="width: ${progress}%"></div>
        </div>
      </div>
    `
  }
  
  // Render achievements
  const achievements = document.getElementById('achievements')
  if (achievements) {
    const defaultAchievements = [
      { name: 'Oak of Focus', icon: 'park', color: 'text-primary', earned: totalHours >= 10 },
      { name: 'Morning Lavender', icon: 'filter_vintage', color: 'text-secondary', earned: insights.currentStreak >= 7 },
      { name: 'Midnight Ivy', icon: 'potted_plant', color: 'text-tertiary', earned: false },
    ]
    
    achievements.innerHTML = `
      <div class="flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="flex-1 space-y-4">
          <h4 class="text-2xl font-headline font-extrabold">Gardening Achievements</h4>
          <p class="text-on-surface-variant">Each focus session nurtures a unique part of your digital sanctuary.</p>
          <div class="flex flex-wrap gap-3 pt-2">
            ${defaultAchievements.map(ach => `
              <div class="bg-surface-container-lowest px-4 py-2 rounded-full border border-outline-variant/20 flex items-center gap-2 ${ach.earned ? '' : 'opacity-50 grayscale'}">
                <span class="material-symbols-outlined ${ach.color} text-sm" style="font-variation-settings: 'FILL' 1;">${ach.icon}</span>
                <span class="text-xs font-bold">${ach.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `
  }
}

initInsightsPage().catch(console.error)
```

- [ ] **Step 3: Test insights page**

Run: `cd sproutdoro && npm run dev`
Open: `http://localhost:5173/insights.html`
Expected:
- Streak card shows correct number
- Bar chart displays weekly data
- Pie chart shows focus distribution
- Total focus hours with progress bar
- Achievement badges (earned vs locked)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: implement insights page with streaks, charts, and achievements"
git push -u origin feature/insights-page
gh pr create --title "feat: add insights page" --body "Implements Focus Insights page with daily streak counter, weekly bar chart, focus distribution pie chart, total hours with goal progress, and achievement badges." --base main
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

---

## Task 8: Audio System

**Branch:** `feature/audio-system`

**Goal:** Add sounds for timer completion and ambient background during sessions.

**Files:**
- Create: `sproutdoro/src/scripts/audio.ts`
- Add: Sound files to `sproutdoro/public/sounds/`

- [ ] **Step 1: Implement AudioManager**

File: `sproutdoro/src/scripts/audio.ts`

```typescript
class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private ambient: HTMLAudioElement | null = null
  private globalVolume: number = 0.5
  private muted: boolean = false
  
  async loadSound(name: string, url: string): Promise<void> {
    const audio = new Audio(url)
    audio.preload = 'auto'
    
    return new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => {
        this.sounds.set(name, audio)
        resolve()
      }, { once: true })
      
      audio.addEventListener('error', () => {
        reject(new Error(`Failed to load sound: ${name}`))
      }, { once: true })
      
      audio.load()
    })
  }
  
  playSound(name: string, volume?: number): void {
    if (this.muted) return
    
    const audio = this.sounds.get(name)
    if (!audio) {
      console.warn(`Sound not found: ${name}`)
      return
    }
    
    const clone = audio.cloneNode() as HTMLAudioElement
    clone.volume = (volume ?? this.globalVolume) * this.globalVolume
    clone.play().catch(err => console.warn('Audio play failed:', err))
  }
  
  playCompletion(): void {
    this.playSound('complete')
  }
  
  playBreakStart(): void {
    this.playSound('break-start')
  }
  
  startAmbient(soundName: string): void {
    if (this.muted) return
    
    this.stopAmbient()
    
    const audio = this.sounds.get(soundName)
    if (!audio) return
    
    this.ambient = audio.cloneNode() as HTMLAudioElement
    this.ambient.loop = true
    this.ambient.volume = this.globalVolume * 0.3 // Lower volume for ambient
    this.ambient.play().catch(err => console.warn('Ambient play failed:', err))
  }
  
  stopAmbient(): void {
    if (this.ambient) {
      this.ambient.pause()
      this.ambient = null
    }
  }
  
  setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume))
    
    if (this.ambient) {
      this.ambient.volume = this.globalVolume * 0.3
    }
  }
  
  mute(): void {
    this.muted = true
    this.stopAmbient()
  }
  
  unmute(): void {
    this.muted = false
  }
}

const audioManager = new AudioManager()
export default audioManager
```

- [ ] **Step 2: Initialize audio on app start**

Modify: `sproutdoro/src/scripts/timer.ts`

Add at top of file:
```typescript
import audioManager from './audio'
```

Add in `initTimerPage`:
```typescript
// Preload sounds
await audioManager.loadSound('wind-chimes', '/sounds/wind-chimes.mp3')
audioManager.loadSound('birdsong', '/sounds/birdsong.mp3').catch(() => {})
audioManager.loadSound('rain', '/sounds/rain.mp3').catch(() => {})
audioManager.loadSound('complete', '/sounds/complete.mp3').catch(() => {})
audioManager.loadSound('break-start', '/sounds/break-start.mp3').catch(() => {})
```

In `handleComplete`:
```typescript
audioManager.playCompletion()
```

- [ ] **Step 3: Generate placeholder sounds**

Create simple MP3 files (or use data URIs as fallback):

Since we can't easily generate real MP3s, create a simple synthesizer fallback in the audio manager:

Modify `audio.ts` to add Web Audio API fallback:

```typescript
// Add to AudioManager class:
private audioContext: AudioContext | null = null

private getAudioContext(): AudioContext {
  if (!this.audioContext) {
    this.audioContext = new AudioContext()
  }
  return this.audioContext
}

playCompletion(): void {
  if (this.sounds.has('complete')) {
    this.playSound('complete')
  } else {
    // Web Audio API fallback - gentle bell tone
    const ctx = this.getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.frequency.value = 523.25 // C5
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5)
    
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1.5)
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add audio system with completion sounds and ambient playback"
git push -u origin feature/audio-system
gh pr create --title "feat: add audio system" --body "Implements AudioManager with sound loading, completion chime, break start sound, ambient background playback, and Web Audio API fallback." --base main
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

---

## Task 9: PWA & Polish

**Branch:** `feature/pwa-setup`

**Goal:** Finalize PWA manifest, icons, service worker, and cross-page navigation fixes.

**Files:**
- Create: `sproutdoro/public/icons/icon-192x192.png`
- Create: `sproutdoro/public/icons/icon-512x512.png`
- Modify: `sproutdoro/vite.config.ts`
- Modify: All HTML files (add meta tags)

- [ ] **Step 1: Generate app icons**

Create simple SVG-based icons and convert to PNG:

File: `sproutdoro/public/icons/icon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="#516233"/>
  <text x="256" y="320" font-family="Arial" font-size="280" fill="white" text-anchor="middle">🌱</text>
</svg>
```

Use an online converter or create simple colored squares with plant emoji for now.

For development, create placeholder PNGs:

```bash
cd sproutdoro/public/icons
# Create 192x192 placeholder (green square)
convert -size 192x192 xc:#516233 icon-192x192.png
# Create 512x512 placeholder
convert -size 512x512 xc:#516233 icon-512x512.png
```

If ImageMagick not available, create HTML canvas-based generator:

File: `sproutdoro/scripts/generate-icons.html`

```html
<script>
function createIcon(size) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  
  // Background
  ctx.fillStyle = '#516233'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.25)
  ctx.fill()
  
  // Simple plant icon
  ctx.fillStyle = '#d6eaaf'
  ctx.beginPath()
  ctx.arc(size/2, size/2, size * 0.3, 0, Math.PI * 2)
  ctx.fill()
  
  return canvas.toDataURL('image/png')
}

console.log(createIcon(192))
console.log(createIcon(512))
</script>
```

- [ ] **Step 2: Update HTML meta tags**

Add to all HTML files (`index.html`, `settings.html`, `insights.html`, `garden.html`) in `<head>`:

```html
<meta name="theme-color" content="#516233">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Sproutdoro">
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">
```

- [ ] **Step 3: Test PWA**

Run: `cd sproutdoro && npm run build && npm run preview`
Open: `http://localhost:4173/`
Expected:
- Manifest loads (check DevTools → Application → Manifest)
- Service worker registers (check DevTools → Application → Service Workers)
- App is installable (check address bar for install icon)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add PWA manifest, icons, and service worker configuration"
git push -u origin feature/pwa-setup
gh pr create --title "feat: add PWA support" --body "Adds PWA manifest, app icons, service worker configuration, and mobile meta tags. App is now installable on mobile devices and works offline." --base main
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

---

## Task 10: Docker Deployment

**Branch:** `feature/docker-deployment`

**Goal:** Create Dockerfile and nginx config for containerized deployment.

**Files:**
- Create: `sproutdoro/Dockerfile`
- Create: `nginx.conf`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create Dockerfile**

File: `sproutdoro/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 2: Create nginx config**

File: `nginx.conf`

```nginx
server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;
  
  # Multi-page fallback
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp3)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
  
  # Gzip compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

- [ ] **Step 3: Create docker-compose.yml**

File: `docker-compose.yml`

```yaml
version: '3.8'
services:
  sproutdoro:
    build: ./sproutdoro
    ports:
      - "8080:80"
    restart: unless-stopped
```

- [ ] **Step 4: Test Docker build**

Run:
```bash
cd /Volumes/panoskava_ext/Code_projects/Sproutdoro-V2
docker-compose up --build -d
```
Expected: Container builds and starts successfully

Test: `curl http://localhost:8080`
Expected: Returns HTML content

Cleanup:
```bash
docker-compose down
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add Dockerfile, nginx config, and docker-compose for deployment"
git push -u origin feature/docker-deployment
gh pr create --title "chore: add Docker deployment" --body "Adds multi-stage Dockerfile with nginx:alpine, nginx configuration for multi-page fallback, and docker-compose.yml for easy deployment." --base main
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

---

## Final Verification

- [ ] **Full app test:**
  1. `cd sproutdoro && npm run build`
  2. `npm run preview`
  3. Test all 4 pages load correctly
  4. Test timer countdown works
  5. Test settings persist after reload
  6. Test garden shows plants after session completion
  7. Test insights show data
  8. Test PWA install prompt
  9. Test Docker build succeeds

- [ ] **Final commit:**

```bash
git add -A
git commit -m "chore: final verification and README update"
git push origin main
```

---

## Appendix: Plant Images

For the garden page to look great, add real plant images. Download from Unsplash or similar:

```bash
# Create directories
mkdir -p sproutdoro/public/images/plants

# Download sample images (replace with real commands)
curl -L "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&h=400&fit=crop" -o sproutdoro/public/images/plants/fern.jpg
curl -L "https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=400&h=400&fit=crop" -o sproutdoro/public/images/plants/lavender.jpg
# ... etc for each plant type
```

Update `PlantCard.ts` to use local images:
```typescript
const PLANT_IMAGES: Record<string, string> = {
  'fern': '/images/plants/fern.jpg',
  'lavender': '/images/plants/lavender.jpg',
  // ... etc
}
```

---

*End of Implementation Plan*