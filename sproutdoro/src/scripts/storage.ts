import { openDB, type IDBPDatabase } from 'idb'
import type { Settings, Session, Plant, Insights } from '../types'

const DB_NAME = 'sproutdoro'
const DB_VERSION = 1

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

let dbPromise: Promise<IDBPDatabase<unknown>> | null = null

function getDB(): Promise<IDBPDatabase<unknown>> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' })
          sessionStore.createIndex('by-date', 'startTime')
          sessionStore.createIndex('by-type', 'type')
        }

        if (!db.objectStoreNames.contains('plants')) {
          const plantStore = db.createObjectStore('plants', { keyPath: 'id' })
          plantStore.createIndex('by-rarity', 'rarity')
          plantStore.createIndex('by-level', 'level')
        }

        if (!db.objectStoreNames.contains('insights')) {
          db.createObjectStore('insights', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function initDB(): Promise<void> {
  await getDB()
}

/* ------------------------------------------------------------------ */
/* Settings                                                           */
/* ------------------------------------------------------------------ */

export async function getSettings(): Promise<Settings> {
  try {
    const db = await getDB()
    const stored = await db.get('settings', 'default')
    if (!stored) return DEFAULT_SETTINGS
    // Strip the synthetic id before returning
    const { id, ...settings } = stored as Settings & { id: string }
    return settings as Settings
  } catch (err) {
    console.error('getSettings failed:', err)
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    const db = await getDB()
    await db.put('settings', { ...settings, id: 'default' })
  } catch (err) {
    console.error('saveSettings failed:', err)
  }
}

/* ------------------------------------------------------------------ */
/* Sessions                                                           */
/* ------------------------------------------------------------------ */

export async function createSession(session: Session): Promise<void> {
  try {
    const db = await getDB()
    await db.put('sessions', session)
  } catch (err) {
    console.error('createSession failed:', err)
  }
}

export async function getSessions(
  startDate?: number,
  endDate?: number
): Promise<Session[]> {
  try {
    const db = await getDB()
    if (startDate !== undefined || endDate !== undefined) {
      const tx = db.transaction('sessions')
      const index = tx.store.index('by-date')
      const range = startDate !== undefined && endDate !== undefined
        ? IDBKeyRange.bound(startDate, endDate)
        : startDate !== undefined
          ? IDBKeyRange.lowerBound(startDate)
          : IDBKeyRange.upperBound(endDate!)
      return await index.getAll(range)
    }
    return await db.getAll('sessions')
  } catch (err) {
    console.error('getSessions failed:', err)
    return []
  }
}

export async function getTodaySessions(): Promise<Session[]> {
  const now = new Date()
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1
  return getSessions(startOfDay, endOfDay)
}

export async function getSessionById(id: string): Promise<Session | undefined> {
  try {
    const db = await getDB()
    return await db.get('sessions', id)
  } catch (err) {
    console.error('getSessionById failed:', err)
    return undefined
  }
}

/* ------------------------------------------------------------------ */
/* Plants                                                             */
/* ------------------------------------------------------------------ */

export async function createPlant(plant: Plant): Promise<void> {
  try {
    const db = await getDB()
    await db.put('plants', plant)
  } catch (err) {
    console.error('createPlant failed:', err)
  }
}

export async function getAllPlants(): Promise<Plant[]> {
  try {
    const db = await getDB()
    return await db.getAll('plants')
  } catch (err) {
    console.error('getAllPlants failed:', err)
    return []
  }
}

export async function getPlantById(id: string): Promise<Plant | undefined> {
  try {
    const db = await getDB()
    return await db.get('plants', id)
  } catch (err) {
    console.error('getPlantById failed:', err)
    return undefined
  }
}

export async function updatePlant(plant: Plant): Promise<void> {
  try {
    const db = await getDB()
    await db.put('plants', plant)
  } catch (err) {
    console.error('updatePlant failed:', err)
  }
}

export async function getFeaturedPlant(): Promise<Plant | undefined> {
  try {
    const plants = await getAllPlants()
    if (plants.length === 0) return undefined
    return plants.reduce((best, p) =>
      p.totalFocusMinutes > best.totalFocusMinutes ? p : best
    )
  } catch (err) {
    console.error('getFeaturedPlant failed:', err)
    return undefined
  }
}

/* ------------------------------------------------------------------ */
/* Insights                                                           */
/* ------------------------------------------------------------------ */

function toISODate(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay() // 0 = Sunday
  const diff = d.getDate() - day
  const ws = new Date(d.setDate(diff))
  const y = ws.getFullYear()
  const m = String(ws.getMonth() + 1).padStart(2, '0')
  const dayStr = String(ws.getDate()).padStart(2, '0')
  return `${y}-${m}-${dayStr}`
}

export async function getInsights(): Promise<Insights> {
  try {
    const db = await getDB()
    const cached = await db.get('insights', 'default')
    if (cached) {
      const { id, ...insights } = cached as Insights & { id: string }
      return insights as Insights
    }

    const sessions: Session[] = await db.getAll('sessions')
    const plants: Plant[] = await db.getAll('plants')

    /* ---- daily aggregation ---- */
    const dailyMap = new Map<
      string,
      { sessionsCompleted: number; totalFocusMinutes: number; plantsGrown: number }
    >()

    for (const s of sessions) {
      if (!s.completed || s.type !== 'work') continue
      const key = toISODate(s.startTime)
      const cur = dailyMap.get(key) ?? {
        sessionsCompleted: 0,
        totalFocusMinutes: 0,
        plantsGrown: 0,
      }
      cur.sessionsCompleted += 1
      cur.totalFocusMinutes += s.duration
      dailyMap.set(key, cur)
    }

    for (const p of plants) {
      const key = toISODate(p.plantedAt)
      const cur = dailyMap.get(key) ?? {
        sessionsCompleted: 0,
        totalFocusMinutes: 0,
        plantsGrown: 0,
      }
      cur.plantsGrown += 1
      dailyMap.set(key, cur)
    }

    const sortedDates = Array.from(dailyMap.keys()).sort()

    /* ---- streaks ---- */
    let currentStreak = 0
    let longestStreak = 0

    const todayKey = toISODate(Date.now())
    const todayTs = new Date(todayKey + 'T00:00:00').getTime()

    // Current streak: walk backwards from today (or yesterday if today empty)
    const startKey = dailyMap.has(todayKey) ? todayKey : toISODate(todayTs - 24 * 60 * 60 * 1000)
    if (dailyMap.has(startKey)) {
      currentStreak = 1
      let checkTs = new Date(startKey + 'T00:00:00').getTime() - 24 * 60 * 60 * 1000
      while (dailyMap.has(toISODate(checkTs))) {
        currentStreak += 1
        checkTs -= 24 * 60 * 60 * 1000
      }
    }

    // Longest streak
    if (sortedDates.length > 0) {
      let run = 1
      longestStreak = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1] + 'T00:00:00').getTime()
        const curr = new Date(sortedDates[i] + 'T00:00:00').getTime()
        if ((curr - prev) / (24 * 60 * 60 * 1000) === 1) {
          run += 1
          longestStreak = Math.max(longestStreak, run)
        } else {
          run = 1
        }
      }
    }

    /* ---- stats structures ---- */
    const dailyStats = sortedDates.map((date) => ({
      date,
      ...dailyMap.get(date)!,
    }))

    const weeklyMap = new Map<string, { totalFocusMinutes: number; plantsGrown: number }>()
    for (const ds of dailyStats) {
      const ws = getWeekStart(ds.date)
      const cur = weeklyMap.get(ws) ?? { totalFocusMinutes: 0, plantsGrown: 0 }
      cur.totalFocusMinutes += ds.totalFocusMinutes
      cur.plantsGrown += ds.plantsGrown
      weeklyMap.set(ws, cur)
    }
    const weeklyStats = Array.from(weeklyMap.entries()).map(([weekStart, data]) => ({
      weekStart,
      ...data,
    }))

    const lastSessionDate =
      sessions.length > 0 ? Math.max(...sessions.map((s) => s.startTime)) : 0

    return {
      currentStreak,
      longestStreak,
      lastSessionDate,
      dailyStats,
      weeklyStats,
      achievements: [],
      monthlyGoalHours: 40,
    }
  } catch (err) {
    console.error('getInsights failed:', err)
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: 0,
      dailyStats: [],
      weeklyStats: [],
      achievements: [],
      monthlyGoalHours: 40,
    }
  }
}

export async function updateInsights(insights: Insights): Promise<void> {
  try {
    const db = await getDB()
    await db.put('insights', { ...insights, id: 'default' })
  } catch (err) {
    console.error('updateInsights failed:', err)
  }
}
