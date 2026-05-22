import {
  initDB,
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
  updateInsights,
} from './storage'
import type { Session, Plant, Insights } from '../types'

const results: { name: string; pass: boolean; error?: string }[] = []

function assert(condition: boolean, name: string): void {
  if (condition) {
    results.push({ name, pass: true })
    console.log(`✅ ${name}`)
  } else {
    results.push({ name, pass: false, error: 'Assertion failed' })
    console.error(`❌ ${name}`)
  }
}

export async function runStorageTests(): Promise<void> {
  console.log('🌱 Sproutdoro Storage Tests Starting...')
  results.length = 0

  try {
    // Clear any existing test DB
    indexedDB.deleteDatabase('sproutdoro')

    await initDB()
    console.log('Database initialized')

    /* ---- Settings Tests ---- */
    const defaultSettings = await getSettings()
    assert(defaultSettings.workDuration === 25, 'getSettings returns default workDuration')
    assert(defaultSettings.theme === 'light', 'getSettings returns default theme')

    const customSettings = { ...defaultSettings, workDuration: 45, theme: 'dark' as const }
    await saveSettings(customSettings)
    const retrievedSettings = await getSettings()
    assert(retrievedSettings.workDuration === 45, 'saveSettings persists workDuration')
    assert(retrievedSettings.theme === 'dark', 'saveSettings persists theme')

    /* ---- Session Tests ---- */
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
      category: 'rest',
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

    const allSessions = await getSessions()
    assert(allSessions.length === 3, 'getSessions returns all sessions')

    const todaySessions = await getTodaySessions()
    assert(todaySessions.length === 2, 'getTodaySessions returns only today sessions')

    const singleSession = await getSessionById('s1')
    assert(singleSession?.id === 's1', 'getSessionById returns correct session')

    const rangeSessions = await getSessions(todayStart, todayStart + 24 * 60 * 60 * 1000 - 1)
    assert(rangeSessions.length === 2, 'getSessions with date range filters correctly')

    /* ---- Plant Tests ---- */
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

    const allPlants = await getAllPlants()
    assert(allPlants.length === 2, 'getAllPlants returns all plants')

    const singlePlant = await getPlantById('p2')
    assert(singlePlant?.type === 'rose', 'getPlantById returns correct plant')

    const updatedPlant: Plant = { ...plant1, level: 2 as Plant['level'], totalFocusMinutes: 75 }
    await updatePlant(updatedPlant)
    const retrievedUpdated = await getPlantById('p1')
    assert(retrievedUpdated?.level === 2, 'updatePlant updates level')
    assert(retrievedUpdated?.totalFocusMinutes === 75, 'updatePlant updates totalFocusMinutes')

    const featured = await getFeaturedPlant()
    assert(featured?.id === 'p2', 'getFeaturedPlant returns plant with highest focus minutes')

    /* ---- Insights Tests ---- */
    const insights = await getInsights()
    assert(insights.currentStreak >= 1, 'getInsights computes current streak')
    assert(insights.dailyStats.length === 2, 'getInsights computes daily stats for 2 days')
    assert(
      insights.dailyStats.some((d) => d.sessionsCompleted === 2),
      'getInsights counts today sessions correctly'
    )
    assert(
      insights.dailyStats.some((d) => d.plantsGrown === 1),
      'getInsights counts plants grown correctly'
    )
    assert(insights.weeklyStats.length >= 1, 'getInsights computes weekly stats')
    assert(insights.lastSessionDate === session3.startTime, 'getInsights sets lastSessionDate')

    // Test caching
    const cachedInsights: Insights = {
      ...insights,
      currentStreak: 999,
    }
    await updateInsights(cachedInsights)
    const retrievedInsights = await getInsights()
    assert(retrievedInsights.currentStreak === 999, 'getInsights returns cached insights when available')

    console.log('\n📊 Test Summary:')
    const passed = results.filter((r) => r.pass).length
    const failed = results.filter((r) => !r.pass).length
    console.log(`   Passed: ${passed}/${results.length}`)
    console.log(`   Failed: ${failed}/${results.length}`)

    if (failed > 0) {
      console.error('\n❌ Some tests failed!')
    } else {
      console.log('\n✅ All tests passed!')
    }

    return
  } catch (err) {
    console.error('Test suite failed:', err)
  }
}
