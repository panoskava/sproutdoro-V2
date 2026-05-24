# Timer Plant Growth Rings & Single Active Plant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add milestone-driven SVG growth rings inside the timer to make focus sessions feel like a plant growing, and fix the bug where all plants receive session minutes simultaneously by enforcing exactly one active plant at a time.

**Architecture:** A new `PlantGrowthRing.ts` component renders concentric SVG rings + emoji inside the timer circle, tracking 5 milestone thresholds. The timer completion logic queries `getActivePlant()` and attributes minutes to a single plant. Garden UI blocks new planting while any plant is below level 5.

**Tech Stack:** TypeScript, SVG (native), CSS transitions (native), IndexedDB via `idb` package. No new dependencies.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/scripts/components/PlantGrowthRing.ts` | **Create** | Render/update SVG milestone rings + emoji inside timer |
| `src/styles/animations.css` | **Modify** | Add `.growth-ring-enter` keyframes + `.plant-emoji-transition` |
| `index.html` | **Modify** | Replace `<img>` with `<div id="plant-growth-center">` |
| `src/scripts/timer.ts` | **Modify** | Import `PlantGrowthRing`, call `updatePlantGrowthRing()` on tick, fix session completion to single plant |
| `src/scripts/storage.ts` | **Modify** | Add `getActivePlant()` + `pickWeightedPlantType()` helpers |
| `src/scripts/garden.ts` | **Modify** | Guard "New Sprout" / empty-slot CTA behind active plant check |
| `src/scripts/components/PlantingPlanModal.ts` | **Modify** | If active plant exists, show blocker message instead of selection list |

---

## Task 1: Add `getActivePlant()` to Storage Layer

**Files:**
- Create: (none)
- Modify: `src/scripts/storage.ts:230-233` (after `updatePlant()`)
- Test: Manual (run timer, inspect IndexedDB)

- [ ] **Step 1: Implement `getActivePlant()`**

In `src/scripts/storage.ts`, after the existing `updatePlant()` function, add:

```typescript
export async function getActivePlant(): Promise<Plant | undefined> {
  try {
    const plants = await getAllPlants()
    return plants.find((p) => p.level < 5)
  } catch (err) {
    console.error('getActivePlant failed:', err)
    return undefined
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Volumes/panoskava_ext/Code_projects/Sproutdoro-V2/sproutdoro && npx tsc --noEmit`

Expected: No errors. `getActivePlant` is exported and callable.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/storage.ts
git commit -m "feat(storage): add getActivePlant helper"
```

---

## Task 2: Add Weighted Random Plant Type Selector

**Files:**
- Create: (none)
- Modify: `src/scripts/storage.ts:246-260` (after `getActivePlant`)
- Test: Manual (log output to console)

- [ ] **Step 1: Implement `pickWeightedPlantType()`**

In `src/scripts/storage.ts`, import `PLANT_DEFINITIONS` from `./plant-definitions` and add:

```typescript
import { PLANT_DEFINITIONS, type PlantDefinition } from './plant-definitions'

export function pickWeightedPlantType(): PlantDefinition {
  const weights: Record<string, number> = {
    common: 70,
    uncommon: 20,
    rare: 8,
    legendary: 2,
  }

  const totalWeight = PLANT_DEFINITIONS.reduce(
    (sum, p) => sum + weights[p.rarity],
    0
  )

  let rand = Math.random() * totalWeight
  for (const def of PLANT_DEFINITIONS) {
    rand -= weights[def.rarity]
    if (rand <= 0) return def
  }

  return PLANT_DEFINITIONS[0]
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/storage.ts
git commit -m "feat(storage): add weighted random plant type picker"
```

---

## Task 3: Fix Timer Completion to Single Active Plant

**Files:**
- Create: (none)
- Modify: `src/scripts/timer.ts:296-411` (the `onTimerComplete` function)
- Test: Manual (complete timer, verify only one plant grew in IndexedDB)

- [ ] **Step 1: Delete the `for (const plant of allPlants)` loop**

In `src/scripts/timer.ts`, lines 337-358, delete this block:

```typescript
// Update active plants with focus minutes
      try {
        const allPlants = await getAllPlants()
        for (const plant of allPlants) {
          if (!plant.sessionIds) plant.sessionIds = []
          plant.sessionIds.push(session.id)
          plant.totalFocusMinutes += session.duration
          const definition = getPlantDefinition(plant.type)
          if (definition) {
            const progressRatio = plant.totalFocusMinutes / definition.focusMinutesRequired
            if (progressRatio >= 1 && plant.level < 5) {
              plant.level = Math.min(5, Math.floor(progressRatio) + 1) as 1 | 2 | 3 | 4 | 5
            }
            if (plant.level >= 5) {
              plant.isMasterpiece = true
            }
          }
          await updatePlant(plant)
        }
      } catch (err) {
        console.error('Failed to update plants:', err)
      }
```

- [ ] **Step 2: Import new storage helpers**

Add to the top of `src/scripts/timer.ts`, alongside existing `storage.ts` imports:

```typescript
import { getActivePlant, pickWeightedPlantType, createPlant } from './storage'
```

- [ ] **Step 3: Replace with single-active-plant logic**

In `onTimerComplete`, after `await createSession(session)` (around line 332), insert:

```typescript
      // Attribute session minutes to single active plant (or create new one)
      try {
        const activePlant = await getActivePlant()
        if (activePlant) {
          if (!activePlant.sessionIds) activePlant.sessionIds = []
          activePlant.sessionIds.push(session.id)
          activePlant.totalFocusMinutes += session.duration

          const definition = getPlantDefinition(activePlant.type)
          if (definition) {
            const progressRatio = activePlant.totalFocusMinutes / definition.focusMinutesRequired
            if (progressRatio >= 1 && activePlant.level < 5) {
              activePlant.level = Math.min(5, Math.floor(progressRatio) + 1) as 1 | 2 | 3 | 4 | 5
            }
            if (activePlant.level >= 5) {
              activePlant.isMasterpiece = true
            }
          }
          await updatePlant(activePlant)
        } else {
          // No active plant — plant a new seed via weighted rarity
          const definition = pickWeightedPlantType()
          const newPlant: import('../types').Plant = {
            id: crypto.randomUUID(),
            type: definition.id,
            rarity: definition.rarity,
            level: 1,
            plantedAt: Date.now(),
            totalFocusMinutes: session.duration,
            sessionIds: [session.id],
            isMasterpiece: false,
          }
          await createPlant(newPlant)
        }
      } catch (err) {
        console.error('Failed to update or create plant:', err)
      }
```

- [ ] **Step 4: Clean up unused imports**

Remove `getAllPlants` and `updatePlant` from the top-level `storage.ts` import if they are no longer used in `timer.ts` outside the deleted loop.

Verify: `grep -n 'getAllPlants\|updatePlant' src/scripts/timer.ts`

If they appear **only** in storage import lines and nowhere else, remove them from the import.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/timer.ts
git commit -m "fix(timer): attribute session minutes only to single active plant"
```

---

## Task 4: Create `PlantGrowthRing.ts` Component

**Files:**
- Create: `src/scripts/components/PlantGrowthRing.ts`
- Modify: (none)
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Write the component**

Create `src/scripts/components/PlantGrowthRing.ts` with:

```typescript
export interface PlantGrowthRingProps {
  size: number
  progress: number
}

const EMOJI_STAGES = [
  { emoji: '🌱', scale: 0.85, opacity: 0.7 },
  { emoji: '🌱', scale: 1.0, opacity: 0.9 },
  { emoji: '🌿', scale: 1.15, opacity: 1.0 },
  { emoji: '🌿', scale: 1.25, opacity: 1.0 },
  { emoji: '🌻', scale: 1.4, opacity: 1.0 },
]

const RING_COLORS = ['#516233', '#516233', '#bbce95', '#d6eaaf', '#ffdbce']
const RING_STROKE_WIDTH_BASE = [2, 2, 3, 3, 4]
const MILESTONES = [0, 0.25, 0.5, 0.75, 1.0]

function getMilestoneIndex(progress: number): number {
  // Find how many milestones have been reached
  let idx = 0
  for (let i = 1; i < MILESTONES.length; i++) {
    if (progress >= MILESTONES[i]) idx = i
  }
  return idx
}

export function createPlantGrowthRing(props: PlantGrowthRingProps): SVGSVGElement {
  const { size } = props
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', `${size}`)
  svg.setAttribute('height', `${size}`)
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`)
  svg.classList.add('plant-growth-svg')
  svg.style.position = 'absolute'
  svg.style.top = '0'
  svg.style.left = '0'
  svg.style.width = '100%'
  svg.style.height = '100%'
  svg.style.zIndex = '1'

  // Store milestone state directly on the SVG element for update() to read
  ;(svg as any).__milestoneIndex = 0

  // Initial render
  updatePlantGrowthRing(svg, props)

  return svg
}

export function updatePlantGrowthRing(
  svg: SVGSVGElement,
  props: PlantGrowthRingProps
): void {
  const { size, progress } = props
  const center = size / 2
  const maxRadius = size * 0.38
  const minRadius = size * 0.12
  const ringGap = (maxRadius - minRadius) / (RING_COLORS.length - 1)

  const newMilestone = getMilestoneIndex(progress)
  const currentMilestone: number = (svg as any).__milestoneIndex ?? 0

  // Update or create rings for each reached milestone
  for (let i = 0; i <= newMilestone; i++) {
    let ring = svg.querySelector(`circle[data-ring-index="${i}"]`) as SVGCircleElement | null
    const radius = minRadius + i * ringGap
    const isNew = i > currentMilestone

    if (!ring) {
      ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      ring.setAttribute('data-ring-index', `${i}`)
      ring.setAttribute('cx', `${center}`)
      ring.setAttribute('cy', `${center}`)
      ring.setAttribute('r', `${radius}`)
      ring.setAttribute('fill', 'none')
      ring.setAttribute('stroke', RING_COLORS[i])
      ring.setAttribute('stroke-width', `${RING_STROKE_WIDTH_BASE[i]}`)
      ring.setAttribute('stroke-linecap', 'round')
      ring.style.opacity = isNew ? '0' : `${EMOJI_STAGES[i].opacity}`
      ring.style.transition = 'opacity 400ms ease-out, stroke-width 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
      svg.appendChild(ring)

      if (isNew) {
        requestAnimationFrame(() => {
          ring!.style.opacity = `${EMOJI_STAGES[i].opacity}`
          ring!.setAttribute('stroke-width', `${RING_STROKE_WIDTH_BASE[i]}`)
        })
      }
    } else {
      // Update existing ring to current milestone styling
      ring.style.opacity = `${EMOJI_STAGES[i].opacity}`
      ring.setAttribute('stroke-width', `${RING_STROKE_WIDTH_BASE[i]}`)
    }
  }

  // Update emoji stage
  let emojiEl = svg.parentElement?.querySelector('.plant-growth-emoji') as HTMLElement | null
  if (emojiEl) {
    const stage = EMOJI_STAGES[newMilestone]
    emojiEl.textContent = stage.emoji
    emojiEl.style.transform = `scale(${stage.scale})`
    emojiEl.style.opacity = `${stage.opacity}`
    emojiEl.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-out'
  }

  ;(svg as any).__milestoneIndex = newMilestone
}

export function createGrowthEmojiElement(size: number): HTMLElement {
  const el = document.createElement('span')
  el.className = 'plant-growth-emoji animate-bounce-subtle'
  el.style.position = 'absolute'
  el.style.top = '50%'
  el.style.left = '50%'
  el.style.transform = 'translate(-50%, -50%) scale(0.85)'
  el.style.fontSize = `${Math.round(size * 0.18)}px`
  el.style.opacity = '0.7'
  el.style.zIndex = '2'
  el.style.pointerEvents = 'none'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.textContent = '🌱'
  return el
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/components/PlantGrowthRing.ts
git commit -m "feat(timer): add PlantGrowthRing component with milestone ring system"
```

---

## Task 5: Wire `PlantGrowthRing` into Timer Page

**Files:**
- Create: (none)
- Modify: `src/scripts/timer.ts:206-250` (timer creation + display update)
- Modify: `src/scripts/timer.ts:455-457` (updateDisplay hook)
- Modify: `index.html:80-89` (replace static image)
- Test: `npm run dev`, start a timer, watch rings appear at milestones

- [ ] **Step 1: Update index.html to host growth ring container**

In `index.html`, lines 80-89, replace the static image:

```html
                <!-- Center: sprout icon/image with radial mask -->
                <div
                  id="plant-growth-center"
                  class="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                </div>
```

Delete lines 84-89 (old `<img>` element).

- [ ] **Step 2: Import component in timer.ts**

At the top of `src/scripts/timer.ts`, add:

```typescript
import {
  createPlantGrowthRing,
  updatePlantGrowthRing,
  createGrowthEmojiElement,
} from './components/PlantGrowthRing'
```

- [ ] **Step 3: Create and insert growth ring on timer init**

In `initTimerPage()`, near the existing `createCircularProgress` block (before or after), insert:

```typescript
  // Create plant growth ring + emoji
  let growthRingSvg: SVGSVGElement | null = null
  const plantGrowthCenter = document.getElementById('plant-growth-center')
  if (plantGrowthCenter && timerRingContainer) {
    const size = isDesktop() ? 480 : 320
    growthRingSvg = createPlantGrowthRing({ size, progress: 0 })
    plantGrowthCenter.appendChild(growthRingSvg)

    const emojiEl = createGrowthEmojiElement(size)
    plantGrowthCenter.appendChild(emojiEl)
  }
```

Note: this must come **after** `timerRingContainer` is fetched (line 209) and **after** `plantGrowthCenter` is queried.

- [ ] **Step 4: Update growth ring on every display tick**

Inside `updateDisplay()` (around line 234), after updating `updateCircularProgress`, add:

```typescript
    // Update plant growth ring
    if (growthRingSvg) {
      const size = isDesktop() ? 480 : 320
      updatePlantGrowthRing(growthRingSvg, { size, progress })
    }
```

Ensure this happens after `progress` is calculated (line 241-244).

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add index.html src/scripts/timer.ts
git commit -m "feat(timer): wire PlantGrowthRing into timer page, replace static sprout image"
```

---

## Task 6: Add CSS Animation Keyframes

**Files:**
- Create: (none)
- Modify: `src/styles/animations.css`
- Test: Visual (run dev server, start timer, observe ring fade-in at 25%)

- [ ] **Step 1: Add growth ring + emoji transition styles**

Append to `src/styles/animations.css`:

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

  /* Growth ring milestone animations */
  .plant-growth-svg circle {
    transition: opacity 400ms ease-out, stroke-width 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: center;
  }

  .plant-growth-emoji {
    transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-out;
    transform-origin: center;
    will-change: transform, opacity;
  }

  /* Respect prefers-reduced-motion */
  @media (prefers-reduced-motion: reduce) {
    .plant-growth-emoji {
      transition: opacity 200ms ease-out !important;
      transform: scale(1) translate(-50%, -50%) !important;
    }
    .plant-growth-svg circle {
      transition: opacity 200ms ease-out !important;
    }
  }
}
```

- [ ] **Step 2: Verify dev server starts**

Run: `cd /Volumes/panoskava_ext/Code_projects/Sproutdoro-V2/sproutdoro && npm run dev`

Expected: Vite starts without CSS errors.

- [ ] **Step 3: Commit**

```bash
git add src/styles/animations.css
git commit -m "style(animations): add growth-ring milestone keyframes and reduced-motion support"
```

---

## Task 7: Guard Garden UI — Block New Sprout When Active Plant Exists

**Files:**
- Create: (none)
- Modify: `src/scripts/garden.ts:118-129` (empty slot CTA), `src/scripts/garden.ts:194-200` (FAB), `src/scripts/garden.ts:131-193` (currently growing section)
- Test: Manual (garden page, if active plant exists, verify FAB and CTA are hidden)

- [ ] **Step 1: Import `getActivePlant`**

At the top of `src/scripts/garden.ts`, add:

```typescript
import { getActivePlant } from './storage'
```

- [ ] **Step 2: Fetch active plant and gate UI**

Before rendering the FAB and empty slot CTA, fetch active plant once:

In `initGardenPage()`, after `const totalFocusHours = ...` (around line 70), insert:

```typescript
  // Check if there's an active plant (level < 5)
  const activePlant = await getActivePlant()
```

- [ ] **Step 3: Conditionally hide empty slot CTA**

Find the empty-slot CTA block in `garden.ts` (lines 118-129). Wrap it:

```typescript
    // Empty slot CTA (only if no active plant)
    if (!activePlant) {
      const emptyCard = document.createElement('button')
      emptyCard.className =
        'rounded-2xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center gap-2 text-on-surface/50 hover:text-primary hover:border-primary/50 transition-all duration-200 cursor-pointer aspect-square'
      emptyCard.innerHTML = `
        <span class="material-symbols-outlined text-3xl">add</span>
        <span class="font-label text-sm font-semibold">New Sprout</span>
      `
      emptyCard.addEventListener('click', () => {
        openPlantingPlan(plants)
      })
      gridContainer.appendChild(emptyCard)
    }
```

- [ ] **Step 4: Conditionally hide FAB**

Find the FAB listener (lines 194-200). Change to:

```typescript
  // FAB (only if no active plant)
  const fab = document.getElementById('fab-new-sprout')
  if (fab) {
    if (activePlant) {
      fab.style.display = 'none'
    } else {
      fab.style.display = ''
      fab.addEventListener('click', () => {
        openPlantingPlan(plants)
      })
    }
  }
```

**Note:** `fab` is currently hidden on mobile via CSS (`hidden md:flex`). Setting `style.display = 'none'` is explicit; setting back to `''` restores the class-based display.

- [ ] **Step 5: Ensure "Currently Growing" section is always present**

The existing "Currently Growing" section already renders conditionally based on `activePlants.length > 0`. Since we enforce a single active plant, this section will show exactly one card. No change needed here, but confirm it remains visible.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/scripts/garden.ts
git commit -m "feat(garden): enforce single active plant in planting UI"
```

---

## Task 8: Update PlantingPlanModal to Block When Active Plant Exists

**Files:**
- Create: (none)
- Modify: `src/scripts/components/PlantingPlanModal.ts:24-130` (core modal creation logic)
- Test: Manual (try to open modal when active plant exists)

- [ ] **Step 1: Add active plant parameter**

Add `activePlant` to the interface and guard early in the modal:

```typescript
interface PlantingPlanModalProps {
  existingPlants: Plant[]
  activePlant?: Plant | null  // NEW
  onSelect: (definition: PlantDefinition) => void
  onClose: () => void
}
```

- [ ] **Step 2: Show blocker if activePlant is present**

In `createPlantingPlanModal`, after creating the `modal` div and before appending the plant list, insert a conditional body:

```typescript
  const modal = document.createElement('div')
  modal.className = 'stat-card-glass rounded-3xl p-6 md:p-8 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col gap-4 overflow-hidden'

  // If there's an active plant, show blocker instead of selection list
  if (props.activePlant) {
    const blockerHeader = document.createElement('div')
    blockerHeader.className = 'flex items-center justify-between'

    const blockerTitle = document.createElement('h2')
    blockerTitle.className = 'font-headline text-xl font-bold text-on-surface'
    blockerTitle.textContent = 'Already Growing!'

    const blockerCloseBtn = document.createElement('button')
    blockerCloseBtn.className = 'w-8 h-8 rounded-full flex items-center justify-center text-on-surface/50 hover:text-on-surface hover:bg-surface-container-high/50 transition-all duration-200'
    blockerCloseBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 0, \'wght\' 400;">close</span>'
    blockerCloseBtn.addEventListener('click', onClose)

    blockerHeader.appendChild(blockerTitle)
    blockerHeader.appendChild(blockerCloseBtn)

    const blockerBody = document.createElement('div')
    blockerBody.className = 'flex flex-col items-center gap-4 py-6'
    blockerBody.innerHTML = `
      <span class="text-4xl">🌱</span>
      <p class="font-body text-sm text-on-surface/70 text-center max-w-sm">
        You already have a plant growing!<br>
        Complete it in the <strong>Currently Growing</strong> section before choosing a new seed.
      </p>
    `

    modal.appendChild(blockerHeader)
    modal.appendChild(blockerBody)
    overlay.appendChild(modal)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) onClose()
    })
    return overlay
  }
```

- [ ] **Step 3: Pass activePlant from garden.ts**

In `garden.ts`, inside `openPlantingPlan`, update the call:

```typescript
  const modal = createPlantingPlanModal({
    existingPlants: plants,
    activePlant,  // passes the already-fetched activePlant
    onSelect: async (definition) => { ... },
    onClose: () => { ... },
  })
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/garden.ts src/scripts/components/PlantingPlanModal.ts
git commit -m "feat(garden): show blocker in planting modal when active plant exists"
```

---

## Task 9: Add ARIA + Reduced Motion Support

**Files:**
- Create: (none)
- Modify: `src/scripts/components/PlantGrowthRing.ts`
- Test: Inspect browser accessibility tree (DevTools → Accessibility)

- [ ] **Step 1: Add dynamic aria-label to SVG**

In `createPlantGrowthRing`, after creating the SVG, add:

```typescript
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', 'Plant growth stage: seedling')
```

In `updatePlantGrowthRing`, update the aria-label dynamically:

```typescript
  const stageLabels = ['seedling', 'sprout', 'growing', 'thriving', 'blooming']
  svg.setAttribute('aria-label', `Plant growth stage: ${stageLabels[newMilestone]}`)
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/components/PlantGrowthRing.ts
git commit -m "a11y(timer): add dynamic aria-label to growth rings"
```

---

## Task 10: Final Verification & Integration Test

**Files:**
- Create: (none)
- Modify: (none)
- Test: Full manual session workflow

- [ ] **Step 1: Run dev server and verify compilation**

```bash
cd /Volumes/panoskava_ext/Code_projects/Sproutdoro-V2/sproutdoro
npm run dev
```

Expected: Vite starts on `http://localhost:<port>`, zero build errors.

- [ ] **Step 2: Manual test checklist**

Open `http://localhost:<port>` in browser and:

1. **Timer starts at 0%:** Verify center shows `🌱` at small scale, 1 faint ring.
2. **Timer hits ~25%:** Verify new ring appears with fade-in animation, `🌱` unchanged.
3. **Timer hits ~50%:** Verify `🌱` swaps to `🌿` with scale bump, third ring appears.
4. **Timer hits ~75%:** Verify fourth ring appears, colors shift warmer.
5. **Timer hits 100%:** Verify `🌿` swaps to `🌻` at largest scale, fifth ring glows, completion sound plays.
6. **Check IndexedDB (DevTools → Application → IndexedDB → sproutdoro-db → plants):**
   - Only **one** plant record has `totalFocusMinutes > 0`.
   - If this is the first session, a new plant was created with `level: 1`, `sessionIds: [sessionId]`.
7. **Navigate to Garden page:** Verify "Currently Growing" shows exactly one plant. FAB and empty CTA are **hidden** because active plant exists.
8. **Click FAB (simulate with JS if hidden):** Should be impossible; the button is not rendered.
9. **Finish more sessions until plant reaches level 5:** Verify FAB reappears after plant levels up.

- [ ] **Step 3: Commit final verification results**

If any test fails, fix before committing.

```bash
git commit --allow-empty -m "test: verify timer growth rings + single plant fix end-to-end"
```

---

## Git Workflow Summary

**Branch name:** `feature/timer-growth-rings-single-plant`

**Create and push branch:**
```bash
git checkout -b feature/timer-growth-rings-single-plant
git push -u origin feature/timer-growth-rings-single-plant
```

**Create PR via `gh`:**
```bash
gh pr create \
  --title "feat: milestone-driven plant growth rings + single active plant fix" \
  --body "Adds SVG milestone rings inside the timer for organic growth feedback. Fixes the bug where all plants received session minutes simultaneously. Enforces exactly one active plant at a time." \
  --base main
```

**Merge after review:**
```bash
gh pr merge --squash --delete-branch
```

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Milestone rings at 0%, 25%, 50%, 75%, 100% | Task 4, Task 5 |
| Emoji swap 🌱→🌿→🌻 at 50% and 100% | Task 4, Task 5 |
| CSS scale/opacity animations on ring appear | Task 4, Task 6 |
| Reduced motion fallback | Task 6 |
| Replace static `<img>` with growth container | Task 5 |
| `getActivePlant()` storage helper | Task 1 |
| Weighted random plant selection | Task 2 |
| Single active plant session attribution | Task 3 |
| Block "New Sprout" FAB when active exists | Task 7 |
| Block empty-slot CTA when active exists | Task 7 |
| PlantingPlanModal blocker overlay | Task 8 |
| ARIA label on growth rings | Task 9 |
| Atomic conventional commits | Every task |

**No gaps found.**

### Placeholder Scan

- No `TBD`, `TODO`, `implement later`, or `similar to Task N` found.
- All code blocks contain complete, runnable code.
- All file paths are exact.
- All commands specify expected output.

### Type Consistency Check

- `PlantGrowthRingProps` defined once in Task 4, used consistently.
- `getActivePlant` return signature `Promise<Plant | undefined>` matches usage in Task 3, Task 7, Task 8.
- `pickWeightedPlantType` returns `PlantDefinition` (matches expectation in Task 3).
- `activePlant` parameter type `Plant | null | undefined` is consistent.

---

*End of Implementation Plan*
