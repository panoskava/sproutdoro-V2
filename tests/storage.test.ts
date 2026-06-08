import { describe, it, expect, beforeEach } from 'vitest'
import {
  initDB,
  resetDBConnection,
  getSettings,
  saveSettings,
  createSession,
  getSessions,
  getTodaySessions,
  getSessionById,
  createPlant,
  getAllPlants,
  getPlantById,
  updatePlant,
  getFeaturedPlant,
  getInsights,
} from '../src/scripts/storage'
import type { Session, Plant } from '../src/types'

beforeEach(async () => {
  await resetDBConnection()
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('sproutdoro-db')
    req.onsuccess = () => resolve()
    req.onerror = () => reject(new Error('Failed to delete test database'))
    req.onblocked = () => resolve()
  })
  await initDB()
})

describe('storage', () => {
  it('returns default settings', async () => {
    const settings = await getSettings()
    expect(settings.workDuration).toBe(25)
    expect(settings.theme).toBe('light')
  })

  it('persists settings', async () => {
    const settings = await getSettings()
    await saveSettings({ ...settings, workDuration: 45, theme: 'dark' })
    const retrieved = await getSettings()
    expect(retrieved.workDuration).toBe(45)
    expect(retrieved.theme).toBe('dark')
  })

  it('creates and queries sessions', async () => {
    const todayStart = new Date().setHours(0, 0, 0, 0)
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000

    const session1: Session = {
      id: 's1',
      startTime: todayStart + 1000,
      endTime: todayStart + 26 * 60 * 1000,
      duration: 25,
      type: 'work',
      plantId: null,
      category: 'coding',
      completed: true,
    }

    const session2: Session = {
      id: 's2',
      startTime: yesterdayStart + 1000,
      endTime: yesterdayStart + 6 * 60 * 1000,
      duration: 5,
      type: 'shortBreak',
      plantId: null,
      category: null,
      completed: true,
    }

    const session3: Session = {
      id: 's3',
      startTime: todayStart + 2 * 60 * 60 * 1000,
      endTime: todayStart + 2 * 60 * 60 * 1000 + 25 * 60 * 1000,
      duration: 25,
      type: 'work',
      plantId: null,
      category: 'design',
      completed: true,
    }

    await createSession(session1)
    await createSession(session2)
    await createSession(session3)

    expect((await getSessions()).length).toBe(3)
    expect((await getTodaySessions()).length).toBe(2)
    expect((await getSessionById('s1'))?.id).toBe('s1')

    const rangeSessions = await getSessions(
      new Date(todayStart),
      new Date(todayStart + 24 * 60 * 60 * 1000 - 1)
    )
    expect(rangeSessions.length).toBe(2)
  })

  it('manages plants', async () => {
    const todayStart = new Date().setHours(0, 0, 0, 0)
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000

    const plant1: Plant = {
      id: 'p1',
      type: 'sunflower',
      rarity: 'common',
      level: 1,
      plantedAt: todayStart,
      totalFocusMinutes: 50,
      sessionIds: ['s1'],
      isMasterpiece: false,
    }

    const plant2: Plant = {
      id: 'p2',
      type: 'rose',
      rarity: 'rare',
      level: 2,
      plantedAt: yesterdayStart,
      totalFocusMinutes: 120,
      sessionIds: ['s2'],
      isMasterpiece: false,
    }

    await createPlant(plant1)
    await createPlant(plant2)

    expect((await getAllPlants()).length).toBe(2)
    expect((await getPlantById('p2'))?.type).toBe('rose')

    await updatePlant({ ...plant1, level: 2, totalFocusMinutes: 75 })
    const updated = await getPlantById('p1')
    expect(updated?.level).toBe(2)
    expect(updated?.totalFocusMinutes).toBe(75)

    expect((await getFeaturedPlant())?.id).toBe('p2')
  })

  it('computes insights from sessions and plants', async () => {
    const todayStart = new Date().setHours(0, 0, 0, 0)

    await createSession({
      id: 's1',
      startTime: todayStart + 1000,
      endTime: todayStart + 26 * 60 * 1000,
      duration: 25,
      type: 'work',
      plantId: null,
      category: null,
      completed: true,
    })

    await createPlant({
      id: 'p1',
      type: 'sunflower',
      rarity: 'common',
      level: 1,
      plantedAt: todayStart,
      totalFocusMinutes: 25,
      sessionIds: ['s1'],
      isMasterpiece: false,
    })

    const insights = await getInsights()
    expect(insights.currentStreak).toBeGreaterThanOrEqual(1)
    expect(insights.dailyStats.length).toBeGreaterThanOrEqual(1)
  })
})
