import 'fake-indexeddb/auto'
import { getActivePlant, createPlant, updatePlant } from './storage'
import type { Plant } from '../types'

async function testGetActivePlant() {
  // Clear DB for test isolation
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('sproutdoro-db')
    req.onsuccess = () => resolve()
    req.onerror = () => reject(new Error('Failed to delete test database'))
  })

  // Test 1: No plants = undefined
  let result = await getActivePlant()
  console.assert(result === undefined, 'Should return undefined when no plants exist')
  if (result !== undefined) console.error('❌ FAIL: Should return undefined when no plants exist')
  else console.log('✅ PASS: Returns undefined when no plants exist')

  // Test 2: One plant level 1 = that plant is active
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
  result = await getActivePlant()
  console.assert(result?.id === 'test-plant-1', 'Should return the level-1 plant')
  if (result?.id !== 'test-plant-1') console.error('❌ FAIL: Should return the level-1 plant')
  else console.log('✅ PASS: Returns the level-1 plant')

  // Test 3: Plant level 5 = undefined (not active)
  await updatePlant({ ...plant, level: 5 })
  result = await getActivePlant()
  console.assert(result === undefined, 'Should return undefined when plant is level 5')
  if (result !== undefined) console.error('❌ FAIL: Should return undefined when plant is level 5')
  else console.log('✅ PASS: Returns undefined when plant is level 5')

  // Test 4: Multiple plants, returns one with level < 5
  const plant2: Plant = {
    id: 'test-plant-2',
    type: 'plant-rose',
    rarity: 'uncommon',
    level: 3,
    plantedAt: Date.now(),
    totalFocusMinutes: 10,
    sessionIds: [],
    isMasterpiece: false,
  }
  await createPlant(plant2)
  result = await getActivePlant()
  console.assert(result !== undefined && result.level < 5, 'Should return a plant with level < 5')
  if (!result || result.level >= 5) console.error('❌ FAIL: Should return a plant with level < 5')
  else console.log('✅ PASS: Returns a plant with level < 5')

  console.log('🌱 getActivePlant tests completed!')
}

testGetActivePlant().catch(console.error)
