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
