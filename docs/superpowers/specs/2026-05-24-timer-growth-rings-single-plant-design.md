# Timer Plant Growth Rings & Single Active Plant Enforcement

> **Date:** 2026-05-24
> **Status:** Approved
> **Author:** AI Design Assistant
> **Scope:** Two focused changes — (1) milestone-driven growth ring feedback in the timer, (2) enforce exactly one active plant at a time

---

## 1. Overview

The current Sproutdoro timer shows a static sprout image inside the circular progress ring. It bounces subtly (`animate-bounce-subtle`) but gives **no visual sense of growth** as the countdown progresses. Users get zero feedback until the session ends.

At the same time, the garden system allows (and accidentally encourages) growing **multiple plants simultaneously** because `timer.ts` adds every completed session's minutes to **all** plants. This breaks the intended "focus nurtures one plant" mechanic.

**This design fixes both issues:**
1. **Timer Growth Rings** — milestone-driven SVG concentric rings that appear at 0%, 25%, 50%, 75%, 100%. Each ring triggers a CSS scale-in + opacity animation. The center emoji grows and swaps (🌱 → 🌿 → 🌻). Zero external assets.
2. **Single Active Plant Enforcement** — the timer only contributes focus time to **one** plant. The garden UI prevents planting a new one while any plant is still below level 5.

**Design constraint:** Keep it extremely lightweight. No canvas, no WebGL, no image files, no animation libraries. Pure SVG + CSS transitions.

---

## 2. Feature 1: Timer Plant Growth Rings

### 2.1 Visual Behavior

The growth rings render as an SVG layer **inside** the existing timer glass circle, **behind** the emoji, **in front of** the solid glass background.

| Milestone | Progress | Visual Event | Ring Added | Emoji |
|---|---|---|---|---|
| **Seedling** | 0% | Initial state | Ring 1 (innermost), faint sage, opacity 0.25 | 🌱 at scale 0.85, opacity 0.7 |
| **Sprout** | 25% | Pop animation | Ring 2 appears (scale-in), Ring 1 thickens + opacity up | 🌱 unchanged |
| **Growing** | 50% | Color shift to moss | Ring 3 appears, prior rings turn moss green | 🌿 swap, scale 1.15 |
| **Thriving** | 75% | Warmth blends in | Ring 4 appears, `secondary-fixed` tone introduced | 🌿 unchanged |
| **Bloom** | 100% | Glow pulse + final ring | Ring 5 (outer glow ring), all vivid, brief pulse | 🌻 swap, scale 1.4 |

**Colors per ring:**
1. `#516233` (primary) — very faint
2. `#516233` (primary) — medium
3. `#bbce95` (primary-fixed-dim) — mossy
4. `#d6eaaf` (primary-fixed) — spring green
5. `#ffdbce` (secondary-fixed) — warm blush glow

**Styling constants:**
- Max rings: 5
- Base stroke width when faint: 2px
- Base stroke width when vivid: 4px
- Ring gap step: ~12% of radius (rings are concentric, evenly spaced)
- Milestone animation: `transition: stroke-width 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms ease-out`

### 2.2 Animation Mechanics

When a new milestone crosses, we add a new `<circle>` to the SVG with:
```css
growth-ring-enter {
  transform: scale(0.7);
  opacity: 0;
  transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 400ms ease-out;
}
growth-ring-enter-active {
  transform: scale(1);
  opacity: <target>;
}
```

Because SVG `<circle>` elements inside a `<g>` or `<svg>` can be CSS-transformed in modern browsers, we wrap each ring in a `<g>` and apply the transform to the group. Alternatively, we simply set `r` and `stroke-width` with a CSS transition — simpler and more compatible.

The simpler approach (chosen):
- Create the `<circle>` at its final radius + stroke-width.
- Set initial opacity to 0.
- Next frame (`requestAnimationFrame`), set opacity to target and stroke-width to target.
- CSS `transition` handles the fade-in.

**Emoji transitions:** Pure textContent swap at 50% and 100%, with a simultaneous `transform: scale()` bump via CSS class toggle.

### 2.3 Component API

```typescript
// src/scripts/components/PlantGrowthRing.ts

export interface PlantGrowthRingProps {
  size: number          // 320 (mobile) or 480 (desktop)
  progress: number      // 0.0 to 1.0
}

export function createPlantGrowthRing(props: PlantGrowthRingProps): SVGSVGElement;

export function updatePlantGrowthRing(
  svg: SVGSVGElement,
  props: PlantGrowthRingProps
): void;
```

### 2.4 Internal State

The component must track the **last rendered milestone** to avoid re-triggering animations on every tick.

```typescript
interface RingState {
  milestoneIndex: number  // 0 to 4
  ringsPresent: number    // how many <circle> elements currently in SVG
}
```

`updatePlantGrowthRing` compares `props.progress` against the thresholds `[0, 0.25, 0.50, 0.75, 1.0]`. If `progress` has newly crossed into a higher bracket, append the new ring and update existing ring styles.

### 2.5 Wiring into Timer

In `timer.ts`:
1. Create the growth ring SVG alongside the circular progress SVG (lines 215-230).
2. On every `updateDisplay`, also call `updatePlantGrowthRing(ringSvg, { size, progress })`.
3. Replace the static `<img src="/src/assets/hero.png">` with a `<div>` or `<text>` element that the `PlantGrowthRing` component owns (or manage emoji centrally via a new accessor).

Because the current HTML hardcodes:
```html
<img src="/src/assets/hero.png" alt="Sprout" class="... animate-bounce-subtle" />
```
We change this to a container div:
```html
<div id="plant-growth-center" class="absolute inset-0 flex items-center justify-center pointer-events-none"></div>
```
And `PlantGrowthRing` appends both the SVG rings layer and the emoji element into this container.

### 2.6 Emoji Mapping

The emoji is tied to milestone index, not progress directly:

```typescript
const EMOJI_STAGES = [
  { emoji: '🌱', scale: 0.85, opacity: 0.7 },   // 0% seedling
  { emoji: '🌱', scale: 1.0,  opacity: 0.9 },   // 25% sprout
  { emoji: '🌿', scale: 1.15, opacity: 1.0 },   // 50% growing
  { emoji: '🌿', scale: 1.25, opacity: 1.0 },   // 75% thriving
  { emoji: '🌻', scale: 1.4,  opacity: 1.0 },   // 100% bloom
]
```

---

## 3. Feature 2: Single Active Plant Enforcement

### 3.1 Problem Statement

Current `timer.ts` (lines 338-358):
```typescript
const allPlants = await getAllPlants()
for (const plant of allPlants) {
  if (!plant.sessionIds) plant.sessionIds = []
  plant.sessionIds.push(session.id)
  plant.totalFocusMinutes += session.duration
  // ... leveling logic
  await updatePlant(plant)
}
```

This gives **every** plant the same session minutes, so all plants grow together. The intended mechanic is: *"I choose one seed. Every completed focus session waters that seed until it reaches level 5."*

### 3.2 Fix — Data Flow

**New rule:** At most one plant can be `level < 5` at any time.

**Timer completion logic (revised):**
1. After creating the `Session` record, call `getActivePlant()`.
2. If an active plant exists:
   - `activePlant.sessionIds.push(session.id)`
   - `activePlant.totalFocusMinutes += session.duration`
   - Recompute level based on `getPlantDefinition(activePlant.type).focusMinutesRequired`
   - `updatePlant(activePlant)`
3. If no active plant exists:
   - Randomly pick one `PlantDefinition` from available types (respecting rarity weights).
   - Create a new `Plant` at level 1, with `sessionIds = [session.id]` and `totalFocusMinutes = session.duration`.
   - `createPlant(newPlant)`

**Removed code:** The `for (const plant of allPlants)` loop is **deleted**.

### 3.3 New Storage Helper

```typescript
// src/scripts/storage.ts

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

This is an O(n) scan, but `plants` is expected to be very small (<100 records). If it ever becomes a bottleneck, add a `'by-level'` index query for `IDBKeyRange.lowerBound(1, true)` — but that's premature optimization.

### 3.4 Fix — Garden Planting Restrictions

Currently the garden page lets the user click "New Sprout" / the empty-slot CTA at any time. This must be blocked if an active plant exists.

**PlantingPlanModal changes:**
- Before opening the modal, check `getActivePlant()`.
- If an active plant exists, show a **disabled overlay** over the modal with the message:
  > *"You already have a plant growing! Complete it in the Currently Growing section before choosing a new seed."*
- Alternatively (simpler): just don't open the modal. Show a toast / banner instead.

**Garden UI changes:**
- If `getActivePlant()` returns a plant:
  1. Hide the floating action button (`fab-new-sprout`).
  2. Hide the empty-slot CTA in the grid.
  3. Ensure the "Currently Growing" section is visible and prominent.

### 3.5 Rarity-Based Plant Selection on Completion

When creating a new plant after a session completes, the type should be chosen with weighted randomness matching the `PlantDefinition` rarity table:

| Rarity | Weight |
|--------|--------|
| common | 70% |
| uncommon | 20% |
| rare | 8% |
| legendary | 2% |

Use the existing `PLANT_DEFINITIONS` array from `plant-definitions.ts`.

```typescript
function pickRandomPlantType(): PlantDefinition {
  const rand = Math.random()
  let cumulative = 0
  // normalize weights if needed
  // ... weighted random selection
}
```

---

## 4. Architecture

### 4.1 File Changes

| File | Action | Reason |
|------|--------|--------|
| `src/scripts/components/PlantGrowthRing.ts` | **New** | Milestone-driven SVG growth ring component |
| `src/styles/animations.css` | **Edit** | Add `.growth-ring-enter` and `.plant-emoji-transition` keyframes |
| `src/styles/main.css` | **Edit** | Add `.plant-growth-container` positioning utility |
| `index.html` | **Edit** | Replace `<img class="animate-bounce-subtle">` with `<div id="plant-growth-center">` |
| `src/scripts/timer.ts` | **Edit** | Integrate `PlantGrowthRing`; fix single-plant session attribution |
| `src/scripts/storage.ts` | **Edit** | Add `getActivePlant()` helper |
| `src/scripts/garden.ts` | **Edit** | Guard "New Sprout" buttons behind `getActivePlant()` check |
| `src/scripts/components/PlantingPlanModal.ts` | **Edit** | Show active-plant blocker if one exists |

### 4.2 Data Flow

```
Timer completes (timer.ts)
  → createSession(session)
  → getActivePlant()
    → If exists: updatePlant(activePlant + session minutes)
    → If none: createPlant(newPlant from weighted random type)
  → updateDisplay(progress) triggers updatePlantGrowthRing()
    → SVG rings update via milestone-cross detection
    → Emoji swaps + scales via CSS class toggles
```

### 4.3 No External Dependencies

- Nothing new in `package.json`.
- No new font, image, or sound assets.
- SVG and CSS transitions are native browser features.

---

## 5. UI Spec — Index.html Changes

Current center image:
```html
<img
  src="/src/assets/hero.png"
  alt="Sprout"
  class="w-28 h-28 md:w-44 md:h-44 object-contain image-mask animate-bounce-subtle"
/>
```

Replace with:
```html
<div
  id="plant-growth-center"
  class="absolute inset-0 flex items-center justify-center pointer-events-none"
></div>
```

The `PlantGrowthRing` component appends its SVG + emoji text into this div.

Keep `animate-bounce-subtle` on the emoji `<span>` so it still has gentle life.

---

## 6. Accessibility

- Emoji is purely decorative (conveyed by surrounding stat card text like "Seedling", "Growing"). No `aria-label` needed on the emoji itself.
- `role="img"` + `aria-label="Plant growth stage: seedling"` updated dynamically via JS on the SVG layer.
- Respect `prefers-reduced-motion`: if detected, disable the scale-in ring animations and emoji scale transitions. Still allow opacity changes.

---

## 7. Testing Strategy

| Test | Type | How |
|------|------|-----|
| Milestone 25% triggers ring 2 | Unit | Mock `updatePlantGrowthRing` with progress 0.30, assert innerHTML has 2 circles |
| Milestone 50% swaps emoji | Unit | Mock progress 0.55, assert textContent is 🌿 |
| Active plant gets minutes on complete | Integration | Create plant (level 1), run timer to completion, assert only that plant's `totalFocusMinutes` increased |
| No active plant = new plant created | Integration | Delete all plants, run timer, assert new `Plant` in DB |
| Second active plant blocked in UI | E2E / Manual | Have active plant, visit garden, click "New Sprout", expect blocker toast |
| Reduced motion disables scale ring | Manual | Enable OS reduced motion, start timer, rings should only fade opacity, not scale |

---

## 8. Git Workflow

Follow the project's existing branch strategy (see 2026-05-22 base design, §15).

**Branch name:** `feature/timer-growth-rings-single-plant`

**Atomic commits (conventional):**
1. `feat(timer): add PlantGrowthRing component with milestone ring system`
2. `feat(timer): wire PlantGrowthRing into timer page, replace static sprout image`
3. `fix(timer): attribute session minutes only to single active plant`
4. `feat(storage): add getActivePlant helper`
5. `feat(garden): enforce single active plant in planting UI`
6. `style(animations): add growth-ring milestone keyframes`

**PR via `gh`:**
```bash
gh pr create \
  --title "feat: milestone-driven plant growth rings + single active plant fix" \
  --body "Adds SVG milestone rings inside the timer for organic growth feedback. Fixes the bug where all plants received session minutes simultaneously. Enforces exactly one active plant at a time." \
  --base main
```

**Merge:** `gh pr merge --squash --delete-branch`

**No `git push` or `gh` actions will be performed by this AI session unless explicitly requested by the user.**

---

*End of Design Document*
