export interface PlantDefinition {
  id: string
  name: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  focusMinutesRequired: number
  sessionsRequired: number
  emoji: string
  description: string
}

export const PLANT_DEFINITIONS: PlantDefinition[] = [
  {
    id: 'plant-sunflower',
    name: 'Sunflower',
    icon: 'local_florist',
    rarity: 'common',
    focusMinutesRequired: 25,
    sessionsRequired: 1,
    emoji: '🌻',
    description: 'Bright and cheerful — grows with a single focused session.',
  },
  {
    id: 'plant-basil',
    name: 'Basil',
    icon: 'eco',
    rarity: 'common',
    focusMinutesRequired: 50,
    sessionsRequired: 2,
    emoji: '🌿',
    description: 'A kitchen staple — grows with 2 focused sessions.',
  },
  {
    id: 'plant-rosemary',
    name: 'Rosemary',
    icon: 'forest',
    rarity: 'common',
    focusMinutesRequired: 75,
    sessionsRequired: 3,
    emoji: '🌱',
    description: 'Steady and reliable — grows with 3 focused sessions.',
  },
  {
    id: 'plant-lavender',
    name: 'Lavender',
    icon: 'local_florist',
    rarity: 'uncommon',
    focusMinutesRequired: 100,
    sessionsRequired: 4,
    emoji: '💜',
    description: 'Calm and fragrant — grows with 4 focused sessions.',
  },
  {
    id: 'plant-bamboo',
    name: 'Bamboo',
    icon: 'grass',
    rarity: 'uncommon',
    focusMinutesRequired: 150,
    sessionsRequired: 6,
    emoji: '🎋',
    description: 'Resilient and fast-growing — grows with 6 focused sessions.',
  },
  {
    id: 'plant-orchid',
    name: 'Orchid',
    icon: 'local_florist',
    rarity: 'rare',
    focusMinutesRequired: 200,
    sessionsRequired: 8,
    emoji: '🪻',
    description: 'Exotic and beautiful — grows with 8 focused sessions.',
  },
  {
    id: 'plant-oak',
    name: 'Oak Tree',
    icon: 'park',
    rarity: 'legendary',
    focusMinutesRequired: 500,
    sessionsRequired: 20,
    emoji: '🌳',
    description: 'Ancient and majestic — a true masterpiece of focus.',
  },
]

export const RARITY_ORDER: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  legendary: 3,
}

export function getPlantDefinition(plantType: string): PlantDefinition | undefined {
  return PLANT_DEFINITIONS.find((p) => p.id === plantType)
}

export function getAvailablePlants(unlockedRarities: string[]): PlantDefinition[] {
  return PLANT_DEFINITIONS.filter((p) => unlockedRarities.includes(p.rarity))
}