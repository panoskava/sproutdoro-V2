import { describe, it, expect, beforeEach } from 'vitest'
import { getActivePlant, createPlant, updatePlant, resetDBConnection, initDB } from '../src/scripts/storage'
import type { Plant } from '../src/types'

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

describe('getActivePlant', () => {
  it('returns undefined when no plants exist', async () => {
    expect(await getActivePlant()).toBeUndefined()
  })

  it('returns level-1 plant as active', async () => {
    const plant: Plant = {
      id: 'test-plant-1',
      type: 'plant-sunflower',
      rarity: 'common',
      level: 1,
      plantedAt: Date.now(),
      totalFocusMinutes: 0,
      sessionIds: [],
      isMasterpiece: false,
    }
    await createPlant(plant)
    expect((await getActivePlant())?.id).toBe('test-plant-1')
  })

  it('returns undefined when plant is level 5', async () => {
    const plant: Plant = {
      id: 'test-plant-1',
      type: 'plant-sunflower',
      rarity: 'common',
      level: 1,
      plantedAt: Date.now(),
      totalFocusMinutes: 0,
      sessionIds: [],
      isMasterpiece: false,
    }
    await createPlant(plant)
    await updatePlant({ ...plant, level: 5 })
    expect(await getActivePlant()).toBeUndefined()
  })

  it('returns a plant with level < 5 when multiple exist', async () => {
    await createPlant({
      id: 'test-plant-1',
      type: 'plant-sunflower',
      rarity: 'common',
      level: 5,
      plantedAt: Date.now(),
      totalFocusMinutes: 100,
      sessionIds: [],
      isMasterpiece: true,
    })
    await createPlant({
      id: 'test-plant-2',
      type: 'plant-rose',
      rarity: 'uncommon',
      level: 3,
      plantedAt: Date.now(),
      totalFocusMinutes: 10,
      sessionIds: [],
      isMasterpiece: false,
    })
    const result = await getActivePlant()
    expect(result).toBeDefined()
    expect(result!.level).toBeLessThan(5)
  })
})
