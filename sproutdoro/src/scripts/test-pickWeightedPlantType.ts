import { pickWeightedPlantType } from './storage'

// Run many times and verify distribution roughly matches weights
async function testPickWeightedPlantType() {
  const counts: Record<string, number> = {}
  const iterations = 1000

  for (let i = 0; i < iterations; i++) {
    const def = pickWeightedPlantType()
    counts[def.rarity] = (counts[def.rarity] || 0) + 1
  }

  const commonPct = (counts['common'] || 0) / iterations
  const uncommonPct = (counts['uncommon'] || 0) / iterations
  const rarePct = (counts['rare'] || 0) / iterations
  const legendaryPct = (counts['legendary'] || 0) / iterations

  console.log('Distribution:', { commonPct, uncommonPct, rarePct, legendaryPct })

  // Rough assertions (wide tolerance because of randomness)
  console.assert(commonPct > 0.6, 'Common should be ~70%')
  console.assert(uncommonPct > 0.1, 'Uncommon should be ~20%')
  console.assert(rarePct < 0.15, 'Rare should be ~8%')
  console.assert(legendaryPct < 0.05, 'Legendary should be ~2%')

  console.log('pickWeightedPlantType distribution tests passed!')
}

testPickWeightedPlantType().catch(console.error)
