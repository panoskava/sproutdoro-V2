import { describe, it, expect } from 'vitest'
import { pickWeightedPlantType } from '../src/scripts/storage'

describe('pickWeightedPlantType', () => {
  it('distributes rarities roughly according to weights', () => {
    const counts: Record<string, number> = {}
    const iterations = 2000

    for (let i = 0; i < iterations; i++) {
      const def = pickWeightedPlantType()
      counts[def.rarity] = (counts[def.rarity] || 0) + 1
    }

    const commonPct = (counts['common'] || 0) / iterations
    const uncommonPct = (counts['uncommon'] || 0) / iterations
    const rarePct = (counts['rare'] || 0) / iterations
    const legendaryPct = (counts['legendary'] || 0) / iterations

    expect(commonPct).toBeGreaterThan(0.55)
    expect(uncommonPct).toBeGreaterThan(0.1)
    expect(rarePct).toBeLessThan(0.15)
    expect(legendaryPct).toBeLessThan(0.06)
  })
})
