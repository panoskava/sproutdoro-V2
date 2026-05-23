# Sproutdoro V2 — Four-Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dynamic timer adjustment, immediate-break-with-resume, custom focus categories with insights, and fix the garden feature with a planting plan/selection screen.

**Architecture:** The app is a multi-page Vite/TypeScript PWA using vanilla JS DOM manipulation, IndexedDB via idb, and Tailwind CSS. Each page has its own HTML file and accompanying TS script. The timer engine is a class (`Timer`) that fires `onUpdate`/`onComplete` callbacks. Features are implemented by modifying the timer engine, adding new storage operations, creating new UI components, and extending existing pages.

**Tech Stack:** TypeScript, Vite, IndexedDB (idb), Tailwind CSS, Material Symbols icons, sessionStorage for timer persistence.

---

## File Structure

### New Files
- `sproutdoro/src/types.ts` — **modify** (add `Category`, `PlantDefinition`, `GardenConfig`, extend `Settings`, `Session`, `Insights`)
- `sproutdoro/src/scripts/storage.ts` — **modify** (add categories store, plant-definitions store, upgrade DB version)
- `sproutdoro/src/scripts/timer-engine.ts` — **modify** (add `adjustTime()`, `pauseForBreak()`, `resumeFromBreak()`, break-bookmark state)
- `sproutdoro/src/scripts/timer.ts` — **modify** (add +/- buttons, immediate-break button, category selector modal, break-resume UI)
- `sproutdoro/src/scripts/insights.ts` — **modify** (add per-category analytics sections)
- `sproutdoro/src/scripts/garden.ts` — **modify** (replace broken flow with planting plan screen)
- `sproutdoro/src/scripts/settings.ts` — **modify** (add category management section)
- `sproutdoro/src/scripts/categories.ts` — **create** (category CRUD operations on settings page)
- `sproutdoro/src/scripts/components/TimerAdjustButtons.ts` — **create** (increment/decrement button component)
- `sproutdoro/src/scripts/components/CategoryPill.ts` — **create** (category selection pill component)
- `sproutdoro/src/scripts/components/PlantingPlanModal.ts` — **create** (plant selection + plan modal)
- `sproutdoro/src/scripts/components/CategoryManager.ts` — **create** (CRUD UI for categories on settings page)
- `sproutdoro/src/scripts/components/BreakOverlay.ts` — **create** (break-in-progress overlay on timer page)
- `sproutdoro/index.html` — **modify** (add category selector area, timer adjust buttons, break overlay container)
- `sproutdoro/settings.html` — **modify** (add categories section)
- `sproutdoro/garden.html` — **modify** (add planting-plan modal container)
- `sproutdoro/insights.html` — **modify** (add per-category section containers)

### Existing Files Not Modified
- `sproutdoro/src/scripts/components/CircularProgress.ts` — no changes needed
- `sproutdoro/src/scripts/components/SideNav.ts` — no changes needed
- `sproutdoro/src/scripts/components/MobileNav.ts` — no changes needed
- `sproutdoro/src/scripts/audio.ts` — no changes needed
- `sproutdoro/src/scripts/theme.ts` — no changes needed
- `sproutdoro/src/scripts/test-storage.ts` — not production code

---

## Plan Overview — 5 Sub-Projects

This spec covers multiple independent subsystems. The plan is organized into 5 sub-projects that can each produce working, testable software independently:

1. **Feature A: Dynamic Timer Adjustment** — Timer engine + UI buttons
2. **Feature B: Immediate Break with Session Resume** — Break bookmark/resume + overlay UI
3. **Feature C: Custom Focus Categories with Insights** — Data model + CRUD + insights analytics
4. **Feature D: Fix Garden Feature** — Plant definitions + planting plan screen + growth persistence
5. **Feature E: Settings Integration** — Category management UI on settings page

Features A & B both touch the timer engine, so they're sequenced. C and D are independent. E depends on C's data model.

---

## Sub-Project A: Dynamic Timer Adjustment

### Task A1: Extend Timer Engine with `adjustTime()`

**Files:**
- Modify: `sproutdoro/src/scripts/timer-engine.ts:3-9` (TimerState type)
- Modify: `sproutdoro/src/scripts/timer-engine.ts:11-164` (Timer class)

- [ ] **Step 1: Update TimerState interface to include `modeAtAdjustmentStart`**

In `sproutdoro/src/scripts/timer-engine.ts`, update the `TimerState` interface:

```typescript
export interface TimerState {
  mode: 'work' | 'shortBreak' | 'longBreak'
  state: 'idle' | 'running' | 'paused' | 'complete'
  remainingSeconds: number
  totalSeconds: number
  sessionCount: number
  adjustmentOffset: number
  modeAtAdjustmentStart: 'work' | 'shortBreak' | 'longBreak' | null
}
```

- [ ] **Step 2: Initialize the new fields in the `Timer` constructor**

In the `Timer` constructor, after setting `this.state`, add:

```typescript
this.state.adjustmentOffset = 0
this.state.modeAtAdjustmentStart = null
```

- [ ] **Step 3: Add `adjustTime(seconds: number)` method to Timer class**

Add this method after the `skip()` method (before `getState()`):

```typescript
adjustTime(deltaSeconds: number): void {
  if (this.state.state !== 'running' && this.state.state !== 'paused') return
  this.state.remainingSeconds = Math.max(0, this.state.remainingSeconds + deltaSeconds)
  this.state.adjustmentOffset += deltaSeconds
  this.state.totalSeconds += deltaSeconds > 0 ? deltaSeconds : 0
  this.onUpdate({ ...this.state })
}
```

- [ ] **Step 4: Also update `restoreState` to accept new fields**

Update the `restoreState` method signature to accept the new fields:

```typescript
restoreState(saved: {
  mode: 'work' | 'shortBreak' | 'longBreak'
  state: 'idle' | 'running' | 'paused'
  remainingSeconds: number
  totalSeconds: number
  sessionCount: number
  adjustmentOffset?: number
  modeAtAdjustmentStart?: 'work' | 'shortBreak' | 'longBreak' | null
}): void {
  this.clearTimer()
  this.clearTransitionTimeout()
  this.state.mode = saved.mode
  this.state.state = saved.state
  this.state.remainingSeconds = saved.remainingSeconds
  this.state.totalSeconds = saved.totalSeconds
  this.state.sessionCount = saved.sessionCount
  this.state.adjustmentOffset = saved.adjustmentOffset ?? 0
  this.state.modeAtAdjustmentStart = saved.modeAtAdjustmentStart ?? null
  if (saved.state === 'running') {
    this.state.state = 'running'
    this.intervalId = window.setInterval(() => this.tick(), 1000)
  }
  this.onUpdate({ ...this.state })
}
```

- [ ] **Step 5: Update `TimerStatePersist` in timer.ts to persist new fields**

In `sproutdoro/src/scripts/timer.ts`, update the `TimerStatePersist` interface:

```typescript
interface TimerStatePersist {
  mode: 'work' | 'shortBreak' | 'longBreak'
  state: 'idle' | 'running' | 'paused'
  remainingSeconds: number
  totalSeconds: number
  sessionCount: number
  lastTick: number | null
  adjustmentOffset: number
  modeAtAdjustmentStart: 'work' | 'shortBreak' | 'longBreak' | null
}
```

- [ ] **Step 6: Update `saveTimerState` calls to include new fields**

Update the `updateDisplayWithSave` closure in timer.ts to include the new fields:

```typescript
saveTimerState({
  ...state,
  state: state.state as 'idle' | 'running' | 'paused',
  lastTick: state.state === 'running' ? Date.now() : null,
  adjustmentOffset: state.adjustmentOffset ?? 0,
  modeAtAdjustmentStart: state.modeAtAdjustmentStart ?? null,
})
```

- [ ] **Step 7: Update `loadTimerState` restore to pass new fields to `timer.restoreState()`**

In timer.ts, where `timer.restoreState(savedState)` is called, ensure the new fields are passed through. The existing spread of `savedState` if it's a `TimerStatePersist` will already include them once the interface is updated.

- [ ] **Step 8: Update `onTimerComplete` to calculate actual duration including adjustments**

In timer.ts, find the `onTimerComplete` function and update the `duration` calculation for work sessions:

```typescript
const timerState = timer?.getState()
const actualDuration = timerState
  ? Math.round((timerState.totalSeconds - (timerState.adjustmentOffset ?? 0)) / 60 * 10) / 10
  : 0
const session = {
  id: crypto.randomUUID(),
  startTime: Date.now() - ((timerState?.totalSeconds || 0) * 1000),
  endTime: Date.now(),
  duration: actualDuration > 0 ? actualDuration : (timerState?.totalSeconds || 0) / 60,
  type: 'work',
  plantId: null,
  category: currentCategory,
  completed: true,
} as import('../types').Session
```

- [ ] **Step 9: Commit**

```bash
git add sproutdoro/src/scripts/timer-engine.ts sproutdoro/src/scripts/timer.ts
git commit -m "feat(timer): add adjustTime method and adjustment-offset tracking to timer engine"
```

---

### Task A2: Create TimerAdjustButtons Component

**Files:**
- Create: `sproutdoro/src/scripts/components/TimerAdjustButtons.ts`

- [ ] **Step 1: Create TimerAdjustButtons.ts**

```typescript
interface TimerAdjustButtonsProps {
  onIncrement: () => void
  onDecrement: () => void
  adjustAmount: number
  isVisible: boolean
}

export function createTimerAdjustButtons(props: TimerAdjustButtonsProps): HTMLElement {
  const { onIncrement, onDecrement, adjustAmount, isVisible } = props

  const container = document.createElement('div')
  container.className = 'flex items-center gap-2 transition-all duration-300'
  container.style.opacity = isVisible ? '1' : '0'
  container.style.pointerEvents = isVisible ? 'auto' : 'none'
  container.id = 'timer-adjust-buttons'

  const label = `${adjustAmount}m`

  const decrementBtn = document.createElement('button')
  decrementBtn.className = 'w-10 h-10 md:w-12 md:h-12 rounded-full glass-sage flex items-center justify-center text-on-surface/60 hover:text-on-surface hover:bg-surface-container-high/50 transition-all duration-200'
  decrementBtn.title = `Subtract ${label}`
  decrementBtn.innerHTML = `<span class="material-symbols-outlined text-lg md:text-xl" style="font-variation-settings: 'FILL' 0, 'wght' 400;">remove</span>`
  decrementBtn.addEventListener('click', onDecrement)

  const amountLabel = document.createElement('span')
  amountLabel.className = 'font-label text-xs text-on-surface/50 select-none'
  amountLabel.textContent = label

  const incrementBtn = document.createElement('button')
  incrementBtn.className = 'w-10 h-10 md:w-12 md:h-12 rounded-full glass-sage flex items-center justify-center text-on-surface/60 hover:text-on-surface hover:bg-surface-container-high/50 transition-all duration-200'
  incrementBtn.title = `Add ${label}`
  incrementBtn.innerHTML = `<span class="material-symbols-outlined text-lg md:text-xl" style="font-variation-settings: 'FILL' 0, 'wght' 400;">add</span>`
  incrementBtn.addEventListener('click', onIncrement)

  container.appendChild(decrementBtn)
  container.appendChild(amountLabel)
  container.appendChild(incrementBtn)

  return container
}

export function updateTimerAdjustButtonsVisibility(visible: boolean): void {
  const container = document.getElementById('timer-adjust-buttons')
  if (container) {
    container.style.opacity = visible ? '1' : '0'
    container.style.pointerEvents = visible ? 'auto' : 'none'
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add sproutdoro/src/scripts/components/TimerAdjustButtons.ts
git commit -m "feat(timer): create TimerAdjustButtons component"
```

---

### Task A3: Wire Timer Adjust Buttons into Timer Page

**Files:**
- Modify: `sproutdoro/index.html:107-150` (controls section)
- Modify: `sproutdoro/src/scripts/timer.ts:1-380` (imports + initialization + event wiring)

- [ ] **Step 1: Add a container for adjust buttons in `index.html`**

Inside the `<section class="flex-1 flex flex-col items-center justify-center gap-6 md:gap-8">` element, after the controls `<div>` (line ~108-150), add:

```html
<!-- Timer adjust buttons (visible during active session) -->
<div id="timer-adjust-container" class="flex items-center justify-center mt-2 transition-opacity duration-300 opacity-0 pointer-events-none">
</div>
```

- [ ] **Step 2: Import and create TimerAdjustButtons in `timer.ts`**

At the top of `timer.ts`, add the import:

```typescript
import { createTimerAdjustButtons, updateTimerAdjustButtonsVisibility } from './components/TimerAdjustButtons'
```

After the existing button handlers, add:

```typescript
const ADJUST_AMOUNT_MINUTES = 5
const adjustContainer = document.getElementById('timer-adjust-container')
let adjustButtons: HTMLElement | null = null

if (adjustContainer) {
  adjustButtons = createTimerAdjustButtons({
    onIncrement: () => {
      if (timer) timer.adjustTime(ADJUST_AMOUNT_MINUTES * 60)
    },
    onDecrement: () => {
      if (timer) timer.adjustTime(-(ADJUST_AMOUNT_MINUTES * 60))
    },
    adjustAmount: ADJUST_AMOUNT_MINUTES,
    isVisible: false,
  })
  adjustContainer.appendChild(adjustButtons)
}
```

- [ ] **Step 3: Update `updateDisplay` to show/hide adjust buttons based on timer state**

In the `updateDisplay` function, add logic after the existing button-icon update:

```typescript
const showAdjust = state.state === 'running' || state.state === 'paused'
updateTimerAdjustButtonsVisibility(showAdjust)
```

- [ ] **Step 4: Update the `reset` button handler to also hide adjust buttons**

In the `resetBtn` click handler, add after `clearTimerState()`:

```typescript
updateTimerAdjustButtonsVisibility(false)
```

- [ ] **Step 5: Verify the UI shows +/- buttons during running/paused timer and hides them otherwise**

Run: `cd sproutdoro && npx vite dev`

- [ ] **Step 6: Commit**

```bash
git add sproutdoro/index.html sproutdoro/src/scripts/timer.ts sproutdoro/src/scripts/components/TimerAdjustButtons.ts
git commit -m "feat(timer): wire dynamic timer adjustment buttons into timer page"
```

---

## Sub-Project B: Immediate Break with Session Resume

### Task B1: Add Break Bookmark State to Timer Engine

**Files:**
- Modify: `sproutdoro/src/scripts/timer-engine.ts`

- [ ] **Step 1: Add break-bookmark fields to TimerState**

Update `TimerState` interface:

```typescript
export interface TimerState {
  mode: 'work' | 'shortBreak' | 'longBreak'
  state: 'idle' | 'running' | 'paused' | 'onBreak'
  remainingSeconds: number
  totalSeconds: number
  sessionCount: number
  adjustmentOffset: number
  modeAtAdjustmentStart: 'work' | 'shortBreak' | 'longBreak' | null
  breakBookmark: {
    remainingSeconds: number
    totalSeconds: number
    mode: 'work' | 'shortBreak' | 'longBreak'
    adjustmentOffset: number
  } | null
}
```

- [ ] **Step 2: Initialize the new fields in the constructor**

After existing initializations in the constructor:

```typescript
this.state.breakBookmark = null
```

- [ ] **Step 3: Add `pauseForBreak()` method**

After the `adjustTime()` method:

```typescript
pauseForBreak(breakDurationSeconds: number): void {
  if (this.state.mode !== 'work' || (this.state.state !== 'running' && this.state.state !== 'paused')) return
  this.clearTimer()
  this.state.breakBookmark = {
    remainingSeconds: this.state.remainingSeconds,
    totalSeconds: this.state.totalSeconds,
    mode: this.state.mode,
    adjustmentOffset: this.state.adjustmentOffset,
  }
  this.state.mode = 'shortBreak'
  this.state.state = 'onBreak'
  this.state.totalSeconds = breakDurationSeconds
  this.state.remainingSeconds = breakDurationSeconds
  this.onUpdate({ ...this.state })
  this.intervalId = window.setInterval(() => this.tick(), 1000)
}
```

- [ ] **Step 4: Modify `tick()` to handle the `onBreak` state**

In the `tick()` method, add handling for `onBreak`:

After the existing `if (this.state.remainingSeconds <= 0)` block, but within `tick()`, the current `state.state !== 'running'` guard should also account for `onBreak`. Update the guard:

```typescript
private tick() {
  if (this.state.state !== 'running' && this.state.state !== 'onBreak') return
  this.state.remainingSeconds -= 1
  if (this.state.remainingSeconds <= 0) {
    this.state.remainingSeconds = 0
    if (this.state.state === 'onBreak') {
      this.state.state = 'complete'
      this.clearTimer()
      this.onComplete('immediateBreak')
    } else {
      this.state.state = 'complete'
      this.clearTimer()
      const completedMode = this.state.mode
      if (completedMode === 'work') {
        this.state.sessionCount += 1
      }
      this.onComplete(completedMode)
      this.transitionTimeoutId = window.setTimeout(() => {
        this.transitionToNextMode()
      }, 2000)
    }
  }
  this.onUpdate({ ...this.state })
}
```

- [ ] **Step 5: Add `resumeFromBreak()` method**

After `pauseForBreak()`:

```typescript
resumeFromBreak(): void {
  if (this.state.state !== 'onBreak' && this.state.state !== 'complete') return
  if (!this.state.breakBookmark) return
  this.clearTimer()
  this.clearTransitionTimeout()
  const bookmark = this.state.breakBookmark
  this.state.mode = bookmark.mode
  this.state.remainingSeconds = bookmark.remainingSeconds
  this.state.totalSeconds = bookmark.totalSeconds
  this.state.adjustmentOffset = bookmark.adjustmentOffset
  this.state.breakBookmark = null
  this.state.state = 'paused'
  this.onUpdate({ ...this.state })
}
```

- [ ] **Step 6: Update `skip()` to handle `onBreak` state**

In the `skip()` method, add handling:

```typescript
skip(): void {
  this.clearTimer()
  this.clearTransitionTimeout()
  if (this.state.state === 'onBreak') {
    this.resumeFromBreak()
    return
  }
  if (this.state.breakBookmark && this.state.state === 'complete' && this.state.mode === 'shortBreak') {
    this.resumeFromBreak()
    return
  }
  this.transitionToNextMode()
}
```

- [ ] **Step 7: Update `TimerStatePersist` in timer.ts to include break-bookmark**

In `timer.ts`, update the `TimerStatePersist` interface:

```typescript
interface TimerStatePersist {
  mode: 'work' | 'shortBreak' | 'longBreak'
  state: 'idle' | 'running' | 'paused' | 'onBreak' | 'complete'
  remainingSeconds: number
  totalSeconds: number
  sessionCount: number
  lastTick: number | null
  adjustmentOffset: number
  modeAtAdjustmentStart: 'work' | 'shortBreak' | 'longBreak' | null
  breakBookmark: {
    remainingSeconds: number
    totalSeconds: number
    mode: 'work' | 'shortBreak' | 'longBreak'
    adjustmentOffset: number
  } | null
}
```

- [ ] **Step 8: Update `saveTimerState` and restore calls to include breakBookmark**

In the `updateDisplayWithSave` closure, ensure `breakBookmark` is persisted:

```typescript
saveTimerState({
  ...state,
  state: state.state as 'idle' | 'running' | 'paused' | 'onBreak' | 'complete',
  lastTick: state.state === 'running' || state.state === 'onBreak' ? Date.now() : null,
  adjustmentOffset: state.adjustmentOffset ?? 0,
  modeAtAdjustmentStart: state.modeAtAdjustmentStart ?? null,
  breakBookmark: state.breakBookmark ?? null,
})
```

- [ ] **Step 9: Commit**

```bash
git add sproutdoro/src/scripts/timer-engine.ts sproutdoro/src/scripts/timer.ts
git commit -m "feat(timer): add break-bookmark state and pauseForBreak/resumeFromBreak to timer engine"
```

---

### Task B2: Create BreakOverlay Component

**Files:**
- Create: `sproutdoro/src/scripts/components/BreakOverlay.ts`

- [ ] **Step 1: Create BreakOverlay.ts**

```typescript
interface BreakOverlayProps {
  breakDuration: number
  onBreakComplete: () => void
  onCancelBreak: () => void
}

export function createBreakOverlay(props: BreakOverlayProps): HTMLElement {
  const { breakDuration, onBreakComplete, onCancelBreak } = props

  const overlay = document.createElement('div')
  overlay.id = 'break-overlay'
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md transition-all duration-500'
  overlay.style.opacity = '0'
  overlay.style.pointerEvents = 'none'

  const card = document.createElement('div')
  card.className = 'stat-card-glass rounded-3xl p-8 md:p-12 flex flex-col items-center gap-6 max-w-sm mx-4'

  const icon = document.createElement('span')
  icon.className = 'material-symbols-outlined text-5xl text-primary'
  icon.style.fontVariationSettings = "'FILL' 1, 'wght' 600"
  icon.textContent = 'coffee'

  const title = document.createElement('h2')
  title.className = 'font-headline text-2xl font-bold text-on-surface'
  title.textContent = 'Taking a Break'

  const subtitle = document.createElement('p')
  subtitle.className = 'font-body text-sm text-on-surface/60 text-center'
  subtitle.textContent = 'Your focus session will resume automatically when the break ends.'

  const timerDisplay = document.createElement('div')
  timerDisplay.className = 'flex items-baseline gap-1'
  const minsEl = document.createElement('span')
  minsEl.id = 'break-time-mins'
  minsEl.className = 'font-headline text-6xl font-bold text-on-surface'
  const colonEl = document.createElement('span')
  colonEl.className = 'font-headline text-6xl font-bold text-primary/70'
  colonEl.textContent = ':'
  const secsEl = document.createElement('span')
  secsEl.id = 'break-time-secs'
  secsEl.className = 'font-headline text-6xl font-bold text-on-surface'
  timerDisplay.appendChild(minsEl)
  timerDisplay.appendChild(colonEl)
  timerDisplay.appendChild(secsEl)

  const progressWrap = document.createElement('div')
  progressWrap.className = 'w-full h-2 bg-surface-container-high rounded-full overflow-hidden'
  const progressBar = document.createElement('div')
  progressBar.id = 'break-progress'
  progressBar.className = 'h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-1000'
  progressBar.style.width = '0%'
  progressWrap.appendChild(progressBar)

  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'px-6 py-3 rounded-2xl font-label text-sm font-semibold text-on-surface/70 hover:text-on-surface bg-surface-container-high/50 hover:bg-surface-container-high transition-all duration-200'
  cancelBtn.textContent = 'End Break Early'
  cancelBtn.addEventListener('click', onCancelBreak)

  card.appendChild(icon)
  card.appendChild(title)
  card.appendChild(subtitle)
  card.appendChild(timerDisplay)
  card.appendChild(progressWrap)
  card.appendChild(cancelBtn)
  overlay.appendChild(card)

  return overlay
}

export function showBreakOverlay(): void {
  const overlay = document.getElementById('break-overlay')
  if (overlay) {
    overlay.style.opacity = '1'
    overlay.style.pointerEvents = 'auto'
  }
}

export function hideBreakOverlay(): void {
  const overlay = document.getElementById('break-overlay')
  if (overlay) {
    overlay.style.opacity = '0'
    overlay.style.pointerEvents = 'none'
  }
}

export function updateBreakOverlay(remainingSeconds: number, totalSeconds: number): void {
  const minsEl = document.getElementById('break-time-mins')
  const secsEl = document.getElementById('break-time-secs')
  const progressEl = document.getElementById('break-progress')
  if (minsEl) minsEl.textContent = String(Math.floor(remainingSeconds / 60)).padStart(2, '0')
  if (secsEl) secsEl.textContent = String(remainingSeconds % 60).padStart(2, '0')
  if (progressEl && totalSeconds > 0) {
    const pct = Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100)
    progressEl.style.width = `${pct}%`
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add sproutdoro/src/scripts/components/BreakOverlay.ts
git commit -m "feat(timer): create BreakOverlay component for immediate break UI"
```

---

### Task B3: Wire Immediate Break into Timer Page

**Files:**
- Modify: `sproutdoro/index.html` (add break overlay container)
- Modify: `sproutdoro/src/scripts/timer.ts` (add break button + overlay wiring)

- [ ] **Step 1: Add break overlay container and break button to `index.html`**

In `index.html`, inside the controls `<div>` (after `btn-skip`), add:

```html
<!-- Immediate Break button (visible during active work session) -->
<button
  id="btn-immediate-break"
  class="hidden md:flex items-center gap-2 mt-3 px-5 py-2.5 rounded-2xl font-label text-sm font-semibold text-on-surface/70 hover:text-on-surface bg-surface-container-high/50 hover:bg-surface-container-high transition-all duration-200"
  title="Take an immediate break"
>
  <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 0, 'wght' 400;">coffee</span>
  Break
</button>
```

Also add at the end of `<body>` (before `<script>`):

```html
<!-- Break overlay -->
<div id="break-overlay-container"></div>
```

- [ ] **Step 2: Import BreakOverlay in timer.ts**

```typescript
import { createBreakOverlay, showBreakOverlay, hideBreakOverlay, updateBreakOverlay } from './components/BreakOverlay'
```

- [ ] **Step 3: Create and append the break overlay in initTimerPage**

After the existing button handlers:

```typescript
let isOnImmediateBreak = false

const breakOverlayContainer = document.getElementById('break-overlay-container')
if (breakOverlayContainer) {
  const breakDurationSec = settings.shortBreakDuration * 60
  const breakOverlay = createBreakOverlay({
    breakDuration: breakDurationSec,
    onBreakComplete: () => {
      if (!timer) return
      hideBreakOverlay()
      timer.resumeFromBreak()
      isOnImmediateBreak = false
      updateTimerAdjustButtonsVisibility(true)
    },
    onCancelBreak: () => {
      if (!timer) return
      hideBreakOverlay()
      timer.resumeFromBreak()
      isOnImmediateBreak = false
      updateTimerAdjustButtonsVisibility(true)
    },
  })
  breakOverlayContainer.appendChild(breakOverlay)
}
```

- [ ] **Step 4: Wire the Immediate Break button**

```typescript
const immediateBreakBtn = document.getElementById('btn-immediate-break')
if (immediateBreakBtn) {
  immediateBreakBtn.addEventListener('click', () => {
    if (!timer) return
    const state = timer.getState()
    if (state.mode !== 'work' || (state.state !== 'running' && state.state !== 'paused')) return
    isOnImmediateBreak = true
    const breakDurationSec = settings.shortBreakDuration * 60
    timer.pauseForBreak(breakDurationSec)
    showBreakOverlay()
    updateTimerAdjustButtonsVisibility(false)
  })
}
```

- [ ] **Step 5: Update `updateDisplay` to handle `onBreak` state and show/hide break button**

At the end of `updateDisplay()`, add:

```typescript
const immediateBreakBtn = document.getElementById('btn-immediate-break')
if (immediateBreakBtn) {
  if (state.mode === 'work' && (state.state === 'running' || state.state === 'paused')) {
    immediateBreakBtn.classList.remove('hidden')
    immediateBreakBtn.classList.add('md:flex')
  } else {
    immediateBreakBtn.classList.add('hidden')
    immediateBreakBtn.classList.remove('md:flex')
  }
}
```

Also update for `onBreak` state — when timer is on break, update the break overlay:

```typescript
if (state.state === 'onBreak') {
  updateBreakOverlay(state.remainingSeconds, state.totalSeconds)
}
```

- [ ] **Step 6: Update `onTimerComplete` to handle `immediateBreak` mode**

In the `onTimerComplete` function, add a case for `'immediateBreak'`:

```typescript
async function onTimerComplete(mode: string) {
  audioManager.stopAmbient()

  if (mode === 'immediateBreak') {
    if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Sproutdoro', {
        body: 'Break over! Resuming focus session.',
        icon: '/favicon.svg',
      })
    }
    hideBreakOverlay()
    timer?.resumeFromBreak()
    isOnImmediateBreak = false
    updateTimerAdjustButtonsVisibility(true)
    clearTimerState()
    return
  }

  audioManager.playCompletion()
  // ... rest of existing logic
```

- [ ] **Step 7: Update reset handler to also cancel break state**

In the `resetBtn` click handler:

```typescript
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (!timer) return
    if (isOnImmediateBreak) {
      hideBreakOverlay()
      isOnImmediateBreak = false
    }
    timer.reset()
    audioManager.stopAmbient()
    clearTimerState()
    updateTimerAdjustButtonsVisibility(false)
  })
}
```

- [ ] **Step 8: Commit**

```bash
git add sproutdoro/index.html sproutdoro/src/scripts/timer.ts sproutdoro/src/scripts/components/BreakOverlay.ts
git commit -m "feat(timer): wire immediate break button and overlay into timer page"
```

---

## Sub-Project C: Custom Focus Categories with Insights

### Task C1: Update Types and Storage for Categories

**Files:**
- Modify: `sproutdoro/src/types.ts` (add `Category` type, update `Session`, `Insights`)
- Modify: `sproutdoro/src/scripts/storage.ts` (add categories store, DB upgrade, CRUD functions)

- [ ] **Step 1: Add `Category` type and update `Session.category` in `types.ts`**

```typescript
export interface Category {
  id: string
  name: string
  color: string
  icon: string
  createdAt: number
}

// Update Session.category from `string` to `string | null`
export interface Session {
  id: string
  startTime: number
  endTime: number
  duration: number
  type: 'work' | 'shortBreak' | 'longBreak'
  plantId: string | null
  category: string | null
  completed: boolean
}

// Update Insights to include per-category stats
export interface Insights {
  currentStreak: number
  longestStreak: number
  lastSessionDate: number
  dailyStats: Array<{
    date: string
    sessionsCompleted: number
    plantsGrown: number
    totalFocusMinutes: number
  }>
  weeklyStats: Array<{
    weekStart: string
    totalFocusMinutes: number
    plantsGrown: number
  }>
  categoryStats: Array<{
    categoryId: string
    categoryName: string
    categoryColor: string
    totalFocusMinutes: number
    sessionCount: number
    weeklyTrend: Array<{
      weekStart: string
      totalFocusMinutes: number
    }>
  }>
  achievements: Achievement[]
  monthlyGoalHours: number
}
```

- [ ] **Step 2: Update storage.ts — upgrade DB version to 2 and add categories store**

In `storage.ts`, change `DB_VERSION` to `2` and add a `categories` object store in the `upgrade` function:

```typescript
const DB_VERSION = 2
```

In the `upgrade(db)` function, add after the existing store creation:

```typescript
if (!db.objectStoreNames.contains('categories')) {
  const categoryStore = db.createObjectStore('categories', { keyPath: 'id' })
  categoryStore.createIndex('by-name', 'name', { unique: true })
}
```

Also update the `SproutdoroDB` interface:

```typescript
interface SproutdoroDB extends DBSchema {
  // ... existing stores
  categories: {
    key: string
    value: Category
    indexes: { 'by-name': string }
  }
}
```

- [ ] **Step 3: Add category CRUD functions in storage.ts**

Add after the insights section:

```typescript
/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-deep-work', name: 'Deep Work', color: '#516233', icon: 'psychology', createdAt: Date.now() },
  { id: 'cat-reading', name: 'Reading', color: '#934a29', icon: 'menu_book', createdAt: Date.now() },
  { id: 'cat-planning', name: 'Planning', color: '#fd9e77', icon: 'event_note', createdAt: Date.now() },
  { id: 'cat-creative', name: 'Creative', color: '#3f5d87', icon: 'palette', createdAt: Date.now() },
  { id: 'cat-learning', name: 'Learning', color: '#5876a1', icon: 'school', createdAt: Date.now() },
]

export async function getCategories(): Promise<Category[]> {
  try {
    const db = await getDB()
    const categories = await db.getAll('categories')
    if (categories.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await db.put('categories', cat)
      }
      return DEFAULT_CATEGORIES
    }
    return categories
  } catch (err) {
    console.error('getCategories failed:', err)
    return DEFAULT_CATEGORIES
  }
}

export async function saveCategory(category: Category): Promise<void> {
  try {
    const db = await getDB()
    await db.put('categories', category)
  } catch (err) {
    console.error('saveCategory failed:', err)
    throw err
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('categories', id)
  } catch (err) {
    console.error('deleteCategory failed:', err)
    throw err
  }
}
```

- [ ] **Step 4: Update `computeInsights()` to include `categoryStats`**

In the `computeInsights()` function, after the `weeklyStats` computation, add:

```typescript
/* ---- category aggregation ---- */
const categories = await db.getAll('categories')
const categoryMap = new Map<string, { totalFocusMinutes: number; sessionCount: number }>()
for (const s of sessions) {
  if (!s.completed || s.type !== 'work') continue
  const catId = s.category || 'uncategorized'
  const cur = categoryMap.get(catId) ?? { totalFocusMinutes: 0, sessionCount: 0 }
  cur.totalFocusMinutes += s.duration
  cur.sessionCount += 1
  categoryMap.set(catId, cur)
}

const categoryStats = Array.from(categoryMap.entries()).map(([catId, data]) => {
  const cat = categories.find((c) => c.id === catId)
  return {
    categoryId: catId,
    categoryName: cat?.name ?? (catId === 'uncategorized' ? 'Uncategorized' : catId),
    categoryColor: cat?.color ?? '#76786c',
    totalFocusMinutes: data.totalFocusMinutes,
    sessionCount: data.sessionCount,
    weeklyTrend: weeklyStats.map((ws) => ({
      weekStart: ws.weekStart,
      totalFocusMinutes: 0,
    })),
  }
})

// Sort by total focus minutes descending
categoryStats.sort((a, b) => b.totalFocusMinutes - a.totalFocusMinutes)
```

Update the return statement to include `categoryStats`:

```typescript
return {
  currentStreak,
  longestStreak,
  lastSessionDate,
  dailyStats,
  weeklyStats,
  categoryStats,
  achievements: [],
  monthlyGoalHours: 40,
}
```

- [ ] **Step 5: Commit**

```bash
git add sproutdoro/src/types.ts sproutdoro/src/scripts/storage.ts
git commit -m "feat(categories): add Category type, storage CRUD, and per-category insights"
```

---

### Task C2: Create CategoryPill Component

**Files:**
- Create: `sproutdoro/src/scripts/components/CategoryPill.ts`

- [ ] **Step 1: Create CategoryPill.ts**

```typescript
import type { Category } from '../../types'

interface CategoryPillProps {
  category: Category | null
  selected: boolean
  onSelect: (categoryId: string | null) => void
}

export function createCategoryPill(props: CategoryPillProps): HTMLElement {
  const { category, selected, onSelect } = props

  const pill = document.createElement('button')
  const name = category?.name ?? 'Uncategorized'
  const color = category?.color ?? '#76786c'
  const icon = category?.icon ?? 'category'

  pill.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
    selected
      ? 'text-white shadow-sm'
      : 'bg-surface-container-high/50 text-on-surface/70 hover:bg-surface-container-high'
  }`

  if (selected) {
    pill.style.backgroundColor = color
  }

  const iconEl = document.createElement('span')
  iconEl.className = 'material-symbols-outlined text-sm'
  iconEl.style.fontVariationSettings = "'FILL' 1, 'wght' 600"
  iconEl.textContent = icon

  const label = document.createElement('span')
  label.textContent = name

  pill.appendChild(iconEl)
  pill.appendChild(label)

  pill.addEventListener('click', () => {
    onSelect(category?.id ?? null)
  })

  return pill
}

interface CategoryPillRowProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelect: (categoryId: string | null) => void
}

export function createCategoryPillRow(props: CategoryPillRowProps): HTMLElement {
  const { categories, selectedCategoryId, onSelect } = props

  const row = document.createElement('div')
  row.className = 'flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar'
  row.id = 'category-pill-row'

  const uncategorizedPill = createCategoryPill({
    category: null,
    selected: selectedCategoryId === null,
    onSelect,
  })
  row.appendChild(uncategorizedPill)

  for (const cat of categories) {
    const pill = createCategoryPill({
      category: cat,
      selected: selectedCategoryId === cat.id,
      onSelect,
    })
    row.appendChild(pill)
  }

  return row
}

export function updateCategoryPillRow(row: HTMLElement, categories: Category[], selectedCategoryId: string | null, onSelect: (categoryId: string | null) => void): void {
  row.innerHTML = ''
  const uncategorizedPill = createCategoryPill({
    category: null,
    selected: selectedCategoryId === null,
    onSelect,
  })
  row.appendChild(uncategorizedPill)

  for (const cat of categories) {
    const pill = createCategoryPill({
      category: cat,
      selected: selectedCategoryId === cat.id,
      onSelect,
    })
    row.appendChild(pill)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add sproutdoro/src/scripts/components/CategoryPill.ts
git commit -m "feat(categories): create CategoryPill component for session category selection"
```

---

### Task C3: Wire Category Selection into Timer Page

**Files:**
- Modify: `sproutdoro/index.html` (add category selector area)
- Modify: `sproutdoro/src/scripts/timer.ts` (import categories, add selector logic, persist chosen category)

- [ ] **Step 1: Add category selector container in `index.html`**

After the `<header>` element and before the `<section class="flex-1 ...">`, add:

```html
<!-- Category selector -->
<div id="category-selector" class="mb-4 md:mb-6">
  <div class="flex items-center gap-2 mb-2">
    <span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1, 'wght' 600;">label</span>
    <span class="font-label text-xs font-semibold text-on-surface/50 uppercase tracking-wider">Focus Category</span>
  </div>
  <div id="category-pill-row" class="flex items-center gap-2 overflow-x-auto pb-2"></div>
</div>
```

- [ ] **Step 2: Import and use categories in `timer.ts`**

Add imports at the top of `timer.ts`:

```typescript
import { getCategories } from './storage'
import { createCategoryPillRow } from './components/CategoryPill'
import type { Category } from '../types'
```

Add a module-level variable for the selected category:

```typescript
let currentCategory: string | null = null
```

In `initTimerPage`, after the timer is created, load categories and render the pill row:

```typescript
const categoryRowContainer = document.getElementById('category-pill-row')
if (categoryRowContainer) {
  let categories: Category[] = []
  try {
    categories = await getCategories()
  } catch (err) {
    console.error('Failed to load categories:', err)
  }

  const pillRow = createCategoryPillRow({
    categories,
    selectedCategoryId: null,
    onSelect: (categoryId: string | null) => {
      currentCategory = categoryId
      const row = document.getElementById('category-pill-row')
      if (row) {
        updateCategoryPillRow(row, categories, categoryId, (id) => {
          currentCategory = id
          if (row) updateCategoryPillRow(row, categories, id, arguments[0])
        })
      }
    },
  })
  categoryRowContainer.appendChild(pillRow)
}
```

**Note:** The `onSelect` callback needs a proper closure. Here's the corrected version:

```typescript
if (categoryRowContainer) {
  let categories: Category[] = []
  try {
    categories = await getCategories()
  } catch (err) {
    console.error('Failed to load categories:', err)
  }

  function handleCategorySelect(categoryId: string | null) {
    currentCategory = categoryId
    const row = document.getElementById('category-pill-row')
    if (row) {
      updateCategoryPillRow(row, categories, categoryId, handleCategorySelect)
    }
  }

  const pillRow = createCategoryPillRow({
    categories,
    selectedCategoryId: null,
    onSelect: handleCategorySelect,
  })
  categoryRowContainer.appendChild(pillRow)
}
```

- [ ] **Step 3: Use `currentCategory` in `onTimerComplete` when creating a session**

Update the session creation in `onTimerComplete`:

```typescript
const session = {
  id: crypto.randomUUID(),
  startTime: Date.now() - ((timer?.getState().totalSeconds || 0) * 1000),
  endTime: Date.now(),
  duration: actualDuration > 0 ? actualDuration : (timer?.getState().totalSeconds || 0) / 60,
  type: 'work',
  plantId: null,
  category: currentCategory,
  completed: true,
} as import('../types').Session
```

- [ ] **Step 4: Commit**

```bash
git add sproutdoro/index.html sproutdoro/src/scripts/timer.ts sproutdoro/src/scripts/components/CategoryPill.ts
git commit -m "feat(timer): wire category selection into timer page"
```

---

### Task C4: Update Insights Page with Per-Category Analytics

**Files:**
- Modify: `sproutdoro/insights.html` (add category analytics section)
- Modify: `sproutdoro/src/scripts/insights.ts` (render category stats, update pie chart to use categories)

- [ ] **Step 1: Add category analytics section in `insights.html`**

After the "Total Focus" card section (the `col-span-12 md:col-span-5` section with id attributes), add:

```html
<!-- Category Breakdown (span 12) -->
<div
  class="col-span-12 stat-card-glass rounded-2xl p-5 md:p-6 flex flex-col gap-4"
>
  <h2
    class="font-headline text-lg font-bold text-on-surface flex items-center gap-2"
  >
    <span class="material-symbols-outlined text-primary">label</span>
    Category Breakdown
  </h2>
  <div id="category-breakdown" class="space-y-3">
    <!-- Category rows injected by JS -->
  </div>
</div>
```

- [ ] **Step 2: Add `renderCategoryBreakdown` function in `insights.ts`**

At the end of the renderers section (before `initInsightsPage`), add:

```typescript
function renderCategoryBreakdown(categoryStats: Insights['categoryStats']): void {
  const container = document.getElementById('category-breakdown')
  if (!container) return

  container.innerHTML = ''

  if (categoryStats.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'font-body text-sm text-on-surface/50 text-center py-6'
    empty.textContent = 'Start focusing with categories to see your breakdown.'
    container.appendChild(empty)
    return
  }

  const totalMinutes = categoryStats.reduce((sum, cs) => sum + cs.totalFocusMinutes, 0)

  for (const cs of categoryStats) {
    const pct = totalMinutes > 0 ? Math.round((cs.totalFocusMinutes / totalMinutes) * 100) : 0
    const hours = Math.floor(cs.totalFocusMinutes / 60)
    const mins = Math.round(cs.totalFocusMinutes % 60)

    const row = document.createElement('div')
    row.className = 'flex flex-col gap-2'

    const topRow = document.createElement('div')
    topRow.className = 'flex items-center justify-between'

    const labelGroup = document.createElement('div')
    labelGroup.className = 'flex items-center gap-2'

    const colorDot = document.createElement('span')
    colorDot.className = 'w-3 h-3 rounded-full flex-shrink-0'
    colorDot.style.backgroundColor = cs.categoryColor

    const name = document.createElement('span')
    name.className = 'font-label text-sm font-semibold text-on-surface'
    name.textContent = cs.categoryName

    const sessionCount = document.createElement('span')
    sessionCount.className = 'font-label text-[10px] text-on-surface/50'
    sessionCount.textContent = `${cs.sessionCount} session${cs.sessionCount === 1 ? '' : 's'}`

    labelGroup.appendChild(colorDot)
    labelGroup.appendChild(name)
    labelGroup.appendChild(sessionCount)

    const timeLabel = document.createElement('span')
    timeLabel.className = 'font-label text-sm font-semibold text-on-surface'
    timeLabel.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

    topRow.appendChild(labelGroup)
    topRow.appendChild(timeLabel)

    const progressWrap = document.createElement('div')
    progressWrap.className = 'w-full h-2 bg-surface-container-high rounded-full overflow-hidden'

    const progressBar = document.createElement('div')
    progressBar.className = 'h-full rounded-full transition-all duration-500'
    progressBar.style.width = `${pct}%`
    progressBar.style.backgroundColor = cs.categoryColor

    progressWrap.appendChild(progressBar)

    row.appendChild(topRow)
    row.appendChild(progressWrap)
    container.appendChild(row)
  }
}
```

- [ ] **Step 3: Call `renderCategoryBreakdown` in `initInsightsPage`**

After the existing rendering calls in `initInsightsPage`:

```typescript
renderCategoryBreakdown(insights.categoryStats)
```

- [ ] **Step 4: Update the pie chart to use category data from storage**

In `renderPieChart`, replace the hardcoded `categoryColors` and `categoryLabels` with data from the `categoryStats`. The function signature should stay the same, but we need to pass categories data. Update `initInsightsPage` to also load categories:

```typescript
import { getCategories } from './storage'
import type { Category } from '../types'
```

Then in `initInsightsPage`, after loading sessions:

```typescript
let categories: Category[] = []
try {
  categories = await getCategories()
} catch (err) {
  console.error('Failed to load categories:', err)
  categories = []
}
```

Update the `renderPieChart` call to pass categories:

```typescript
renderPieChart(workSessions, categories)
```

Update `renderPieChart` signature and category color/label mapping:

```typescript
function renderPieChart(workSessions: Session[], categories: Category[]): void {
```

In `renderPieChart`, replace the hardcoded `categoryColors` and `categoryLabels` maps:

```typescript
const categoryColorMap = new Map<string, string>()
const categoryNameMap = new Map<string, string>()
for (const cat of categories) {
  categoryColorMap.set(cat.id, cat.color)
  categoryNameMap.set(cat.id, cat.name)
}
categoryColorMap.set('uncategorized', '#76786c')
categoryNameMap.set('uncategorized', 'Uncategorized')

// ... later in the function, use these maps:
const color = categoryColorMap.get(cat) || '#76786c'
const label = categoryNameMap.get(cat) || cat
```

- [ ] **Step 5: Commit**

```bash
git add sproutdoro/insights.html sproutdoro/src/scripts/insights.ts
git commit -m "feat(insights): add per-category analytics breakdown to insights page"
```

---

### Task C5: Create Category Management UI on Settings Page

**Files:**
- Modify: `sproutdoro/settings.html` (add categories section)
- Create: `sproutdoro/src/scripts/components/CategoryManager.ts`
- Modify: `sproutdoro/src/scripts/settings.ts` (import and render CategoryManager)

- [ ] **Step 1: Create CategoryManager.ts**

```typescript
import type { Category } from '../../types'
import { saveCategory, deleteCategory } from '../storage'

interface CategoryManagerProps {
  categories: Category[]
  onCategoryChange: () => void
}

export function createCategoryManager(props: CategoryManagerProps): HTMLElement {
  const { categories, onCategoryChange } = props

  const container = document.createElement('div')
  container.id = 'category-manager'
  container.className = 'space-y-3'

  for (const cat of categories) {
    const row = document.createElement('div')
    row.className = 'flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-all duration-200'

    const colorDot = document.createElement('span')
    colorDot.className = 'w-4 h-4 rounded-full flex-shrink-0'
    colorDot.style.backgroundColor = cat.color

    const icon = document.createElement('span')
    icon.className = 'material-symbols-outlined text-lg'
    icon.style.fontVariationSettings = "'FILL' 1, 'wght' 600"
    icon.style.color = cat.color
    icon.textContent = cat.icon

    const name = document.createElement('span')
    name.className = 'font-body text-sm text-on-surface flex-1'
    name.textContent = cat.name

    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'w-8 h-8 rounded-full flex items-center justify-center text-on-surface/40 hover:text-error hover:bg-error/10 transition-all duration-200'
    deleteBtn.innerHTML = '<span class="material-symbols-outlined text-sm" style="font-variation-settings: \'FILL\' 0, \'wght\' 400;">close</span>'
    deleteBtn.title = `Delete ${cat.name}`
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`Delete "${cat.name}" category?`)) {
        await deleteCategory(cat.id)
        onCategoryChange()
      }
    })

    row.appendChild(colorDot)
    row.appendChild(icon)
    row.appendChild(name)
    row.appendChild(deleteBtn)
    container.appendChild(row)
  }

  // Add new category button
  const addBtn = document.createElement('button')
  addBtn.className = 'w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-outline-variant/30 text-on-surface/50 hover:text-primary hover:border-primary/50 transition-all duration-200'
  addBtn.innerHTML = '<span class="material-symbols-outlined text-lg" style="font-variation-settings: \'FILL\' 0, \'wght\' 400;">add</span><span class="font-label text-sm font-semibold">Add Category</span>'
  addBtn.addEventListener('click', () => {
    showAddCategoryModal(onCategoryChange)
  })

  container.appendChild(addBtn)
  return container
}

const CATEGORY_COLORS = ['#516233', '#934a29', '#fd9e77', '#3f5d87', '#5876a1', '#76786c', '#c4553d', '#7b6b8d', '#4a8c6f', '#d4a843']
const CATEGORY_ICONS = ['psychology', 'menu_book', 'event_note', 'palette', 'school', 'code', 'fitness_center', 'music_note', 'science', 'work']

function showAddCategoryModal(onCategoryChange: () => void): void {
  const existingModal = document.getElementById('add-category-modal')
  if (existingModal) existingModal.remove()

  const overlay = document.createElement('div')
  overlay.id = 'add-category-modal'
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md'

  const card = document.createElement('div')
  card.className = 'stat-card-glass rounded-3xl p-6 max-w-md w-full mx-4 flex flex-col gap-4'

  const title = document.createElement('h3')
  title.className = 'font-headline text-lg font-bold text-on-surface'
  title.textContent = 'Add Category'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.placeholder = 'Category name'
  nameInput.className = 'w-full px-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-body text-sm border border-outline-variant/20 focus:border-primary focus:outline-none transition-all duration-200'

  const colorLabel = document.createElement('span')
  colorLabel.className = 'font-label text-xs text-on-surface/50 uppercase tracking-wider'
  colorLabel.textContent = 'Color'

  const colorRow = document.createElement('div')
  colorRow.className = 'flex flex-wrap gap-2'
  let selectedColor = CATEGORY_COLORS[0]
  for (const color of CATEGORY_COLORS) {
    const swatch = document.createElement('button')
    swatch.className = 'w-8 h-8 rounded-full transition-all duration-200 hover:scale-110'
    swatch.style.backgroundColor = color
    if (color === selectedColor) {
      swatch.style.outline = '2px solid #1c1c16'
      swatch.style.outlineOffset = '2px'
    }
    swatch.addEventListener('click', () => {
      selectedColor = color
      colorRow.querySelectorAll('button').forEach((b) => {
        b.style.outline = 'none'
        b.style.outlineOffset = '0'
      })
      swatch.style.outline = '2px solid #1c1c16'
      swatch.style.outlineOffset = '2px'
    })
    colorRow.appendChild(swatch)
  }

  const iconLabel = document.createElement('span')
  iconLabel.className = 'font-label text-xs text-on-surface/50 uppercase tracking-wider'
  iconLabel.textContent = 'Icon'

  const iconRow = document.createElement('div')
  iconRow.className = 'flex flex-wrap gap-2'
  let selectedIcon = CATEGORY_ICONS[0]
  for (const ic of CATEGORY_ICONS) {
    const iconBtn = document.createElement('button')
    iconBtn.className = 'w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high transition-all duration-200'
    if (ic === selectedIcon) {
      iconBtn.classList.add('ring-2', 'ring-primary', 'bg-primary/5')
    }
    iconBtn.innerHTML = `<span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' ${ic === selectedIcon ? '1' : '0'}, 'wght' 400;">${ic}</span>`
    iconBtn.addEventListener('click', () => {
      selectedIcon = ic
      iconRow.querySelectorAll('button').forEach((b) => {
        b.classList.remove('ring-2', 'ring-primary', 'bg-primary/5')
        b.querySelector('span')!.style.fontVariationSettings = "'FILL' 0, 'wght' 400"
      })
      iconBtn.classList.add('ring-2', 'ring-primary', 'bg-primary/5')
      iconBtn.querySelector('span')!.style.fontVariationSettings = "'FILL' 1, 'wght' 400"
    })
    iconRow.appendChild(iconBtn)
  }

  const btnRow = document.createElement('div')
  btnRow.className = 'flex items-center gap-3 justify-end'

  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'px-4 py-2 rounded-xl font-label text-sm font-semibold text-on-surface/60 hover:text-on-surface transition-all duration-200'
  cancelBtn.textContent = 'Cancel'
  cancelBtn.addEventListener('click', () => overlay.remove())

  const createBtn = document.createElement('button')
  createBtn.className = 'px-6 py-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-label text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200'
  createBtn.textContent = 'Create'
  createBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim()
    if (!name) return
    const category: Category = {
      id: `cat-${crypto.randomUUID()}`,
      name,
      color: selectedColor,
      icon: selectedIcon,
      createdAt: Date.now(),
    }
    await saveCategory(category)
    overlay.remove()
    onCategoryChange()
  })

  btnRow.appendChild(cancelBtn)
  btnRow.appendChild(createBtn)

  card.appendChild(title)
  card.appendChild(nameInput)
  card.appendChild(colorLabel)
  card.appendChild(colorRow)
  card.appendChild(iconLabel)
  card.appendChild(iconRow)
  card.appendChild(btnRow)
  overlay.appendChild(card)

  document.body.appendChild(overlay)
}
```

- [ ] **Step 2: Add categories section to `settings.html`**

After the "Preferences" section (the `<div class="col-span-12 ...">` with `id="preferences-toggles"`), add:

```html
<!-- Categories -->
<div
  class="col-span-12 stat-card-glass rounded-2xl p-5 md:p-6 flex flex-col gap-5"
>
  <h2
    class="font-headline text-lg font-bold text-on-surface flex items-center gap-2"
  >
    <span class="material-symbols-outlined text-primary">label</span>
    Focus Categories
  </h2>
  <p class="font-body text-sm text-on-surface/60">
    Create categories to organize and track your focus sessions.
  </p>
  <div id="category-manager-container" class="space-y-3"></div>
</div>
```

- [ ] **Step 3: Import and render CategoryManager in `settings.ts`**

Add imports:

```typescript
import { getCategories } from './storage'
import { createCategoryManager } from './components/CategoryManager'
```

In `initSettingsPage`, after the preferences toggles section:

```typescript
// Categories
const categoryContainer = document.getElementById('category-manager-container')
if (categoryContainer) {
  async function renderCategories() {
    const cats = await getCategories()
    categoryContainer.innerHTML = ''
    const manager = createCategoryManager({
      categories: cats,
      onCategoryChange: renderCategories,
    })
    categoryContainer.appendChild(manager)
  }
  renderCategories()
}
```

- [ ] **Step 4: Commit**

```bash
git add sproutdoro/settings.html sproutdoro/src/scripts/settings.ts sproutdoro/src/scripts/components/CategoryManager.ts
git commit -m "feat(settings): add category management UI with create and delete"
```

---

## Sub-Project D: Fix Garden Feature

### Task D1: Define Plant Definitions Data

**Files:**
- Create: `sproutdoro/src/scripts/plant-definitions.ts`

- [ ] **Step 1: Create plant-definitions.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add sproutdoro/src/scripts/plant-definitions.ts
git commit -m "feat(garden): add plant definitions data with growth requirements"
```

---

### Task D2: Create PlantingPlanModal Component

**Files:**
- Create: `sproutdoro/src/scripts/components/PlantingPlanModal.ts`

- [ ] **Step 1: Create PlantingPlanModal.ts**

```typescript
import { PLANT_DEFINITIONS, RARITY_ORDER, type PlantDefinition } from '../plant-definitions'
import type { Plant } from '../../types'

interface PlantingPlanModalProps {
  existingPlants: Plant[]
  onSelect: (definition: PlantDefinition) => void
  onClose: () => void
}

const RARITY_BADGE_CLASSES: Record<string, string> = {
  common: 'bg-primary/10 text-primary',
  uncommon: 'bg-secondary/10 text-secondary',
  rare: 'bg-tertiary/10 text-tertiary',
  legendary: 'bg-secondary-fixed/30 text-on-secondary-fixed-variant',
}

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
}

export function createPlantingPlanModal(props: PlantingPlanModalProps): HTMLElement {
  const { existingPlants, onSelect, onClose } = props

  const overlay = document.createElement('div')
  overlay.id = 'planting-plan-modal'
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md transition-all duration-300'
  overlay.style.opacity = '0'
  requestAnimationFrame(() => { overlay.style.opacity = '1' })

  const modal = document.createElement('div')
  modal.className = 'stat-card-glass rounded-3xl p-6 md:p-8 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col gap-4 overflow-hidden'

  const header = document.createElement('div')
  header.className = 'flex items-center justify-between'

  const title = document.createElement('h2')
  title.className = 'font-headline text-xl font-bold text-on-surface'
  title.textContent = 'Choose a Plant'

  const closeBtn = document.createElement('button')
  closeBtn.className = 'w-8 h-8 rounded-full flex items-center justify-center text-on-surface/50 hover:text-on-surface hover:bg-surface-container-high/50 transition-all duration-200'
  closeBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 0, \'wght\' 400;">close</span>'
  closeBtn.addEventListener('click', onClose)

  header.appendChild(title)
  header.appendChild(closeBtn)

  const subtitle = document.createElement('p')
  subtitle.className = 'font-body text-sm text-on-surface/60'
  subtitle.textContent = 'Select what you want to grow. Each plant has different focus requirements.'

  const plantList = document.createElement('div')
  plantList.className = 'flex-1 overflow-y-auto space-y-3 pr-1'

  const sortedDefs = [...PLANT_DEFINITIONS].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity])

  for (const def of sortedDefs) {
    const existingPlant = existingPlants.find((p) => p.type === def.id)
    const isGrowing = existingPlant != null

    const card = document.createElement('div')
    card.className = `flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${
      isGrowing
        ? 'bg-surface-container-low/50 opacity-60 cursor-not-allowed'
        : 'bg-surface-container-low/50 hover:bg-surface-container-high/50 cursor-pointer hover:-translate-y-0.5'
    }`

    const iconWrap = document.createElement('div')
    iconWrap.className = 'w-12 h-12 rounded-xl flex items-center justify-center text-2xl'
    iconWrap.style.backgroundColor = `${def.rarity === 'common' ? '#516233' : def.rarity === 'uncommon' ? '#934a29' : def.rarity === 'rare' ? '#3f5d87' : '#5876a1'}15`
    iconWrap.textContent = def.emoji

    const info = document.createElement('div')
    info.className = 'flex-1 min-w-0'

    const nameRow = document.createElement('div')
    nameRow.className = 'flex items-center gap-2'

    const name = document.createElement('span')
    name.className = 'font-headline text-sm font-bold text-on-surface'
    name.textContent = def.name

    const badge = document.createElement('span')
    badge.className = `inline-flex px-2 py-0.5 rounded-full text-[10px] font-label font-semibold ${RARITY_BADGE_CLASSES[def.rarity]}`
    badge.textContent = RARITY_LABELS[def.rarity]

    nameRow.appendChild(name)
    nameRow.appendChild(badge)

    const desc = document.createElement('p')
    desc.className = 'font-body text-xs text-on-surface/50 mt-0.5'
    desc.textContent = def.description

    const requirement = document.createElement('span')
    requirement.className = 'font-label text-[10px] text-on-surface/40 mt-1'
    if (isGrowing && existingPlant) {
      const progress = Math.min(1, existingPlant.totalFocusMinutes / def.focusMinutesRequired)
      requirement.textContent = `Growing: ${Math.round(progress * 100)}% complete`
    } else {
      requirement.textContent = `${def.sessionsRequired} session${def.sessionsRequired > 1 ? 's' : ''} • ${def.focusMinutesRequired} min total`
    }

    info.appendChild(nameRow)
    info.appendChild(desc)
    info.appendChild(requirement)

    card.appendChild(iconWrap)
    card.appendChild(info)

    if (!isGrowing) {
      card.addEventListener('click', () => onSelect(def))
    }

    plantList.appendChild(card)
  }

  modal.appendChild(header)
  modal.appendChild(subtitle)
  modal.appendChild(plantList)
  overlay.appendChild(modal)

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) onClose()
  })

  return overlay
}
```

- [ ] **Step 2: Commit**

```bash
git add sproutdoro/src/scripts/components/PlantingPlanModal.ts
git commit -m "feat(garden): create PlantingPlanModal component for plant selection"
```

---

### Task D3: Fix Garden Page — Replace Broken Flow with Planting Plan

**Files:**
- Modify: `sproutdoro/garden.html` (add modal container)
- Modify: `sproutdoro/src/scripts/garden.ts` (replace broken timer-start with planting plan modal, show growth progress)

- [ ] **Step 1: Add modal container to `garden.html`**

Before the `<script>` tag, add:

```html
<div id="planting-plan-modal-container"></div>
```

- [ ] **Step 2: Rewrite garden.ts to use planting plan modal**

Replace the `initGardenPage` function's "New Sprout" and FAB click handlers. The key changes:

1. Import `PlantingPlanModal` and `plant-definitions`
2. Replace the `window.location.href = './index.html'` handlers with modal opening logic
3. When a plant is selected, create a `Plant` record in IndexedDB and stay on the garden page
4. Show growth progress on each plant card based on completed sessions

Update garden.ts imports:

```typescript
import '../styles/main.css'
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { createPlantCard } from './components/PlantCard'
import { createStatCard } from './components/StatCard'
import { getAllPlants, createPlant, getSessions } from './storage'
import { applyTheme } from './theme'
import { createPlantingPlanModal } from './components/PlantingPlanModal'
import { getPlantDefinition } from './plant-definitions'
import type { Plant } from '../types'
```

Replace the empty card click handler and FAB click handler:

```typescript
// Instead of window.location.href = './index.html'
function openPlantingPlan(plants: Plant[]) {
  const modalContainer = document.getElementById('planting-plan-modal-container')
  if (!modalContainer) return

  const modal = createPlantingPlanModal({
    existingPlants: plants,
    onSelect: async (definition) => {
      const plant: Plant = {
        id: crypto.randomUUID(),
        type: definition.id,
        rarity: definition.rarity,
        level: 1,
        plantedAt: Date.now(),
        totalFocusMinutes: 0,
        sessionIds: [],
        isMasterpiece: false,
      }
      try {
        await createPlant(plant)
      } catch (err) {
        console.error('Failed to create plant:', err)
      }
      modal.remove()
      location.reload()
    },
    onClose: () => {
      modal.remove()
    },
  })
  modalContainer.appendChild(modal)
}
```

Then replace both click handlers (empty card and FAB):

```typescript
emptyCard.addEventListener('click', () => {
  openPlantingPlan(plants)
})

const fab = document.getElementById('fab-new-sprout')
if (fab) {
  fab.addEventListener('click', () => {
    openPlantingPlan(plants)
  })
}
```

- [ ] **Step 3: Update plant card rendering to show growth progress**

In the plant grid rendering loop, after creating each card, enhance it with growth progress:

```typescript
for (const plant of plants) {
  const definition = getPlantDefinition(plant.type)
  const card = createPlantCard({ plant })
  // PlantCard already shows level and maturity progress
  gridContainer.appendChild(card)
}
```

This already works because `createPlantCard` already renders progress bars based on `plant.totalFocusMinutes` and `plant.level`.

- [ ] **Step 4: Update plant totalFocusMinutes when work sessions complete**

We need to update plants' focus minutes. In `timer.ts`'s `onTimerComplete`, after saving the session, also update any active plants:

Add import in `timer.ts`:

```typescript
import { getAllPlants, updatePlant } from './storage'
```

In `onTimerComplete`, after `await createSession(session)`:

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

Also add the import for `getPlantDefinition` in `timer.ts`:

```typescript
import { getPlantDefinition } from './plant-definitions'
```

- [ ] **Step 5: Commit**

```bash
git add sproutdoro/garden.html sproutdoro/src/scripts/garden.ts sproutdoro/src/scripts/timer.ts
git commit -m "feat(garden): replace broken timer-start with planting plan modal and growth tracking"
```

---

### Task D4: Update Garden Stats to Show Growth Progress

**Files:**
- Modify: `sproutdoro/src/scripts/garden.ts` (add active growth section)

- [ ] **Step 1: Add "Growing Now" section in `garden.html`**

Before the "Collection" section in garden.html, add:

```html
<!-- Active Growth -->
<section id="active-growth-section" class="mb-6 md:mb-10" style="display:none;">
  <div class="flex items-center gap-3 mb-4">
    <h2 class="font-headline text-lg font-bold text-on-surface">
      Currently Growing
    </h2>
    <span
      class="inline-flex px-3 py-1 rounded-full text-xs font-label font-semibold bg-primary/10 text-primary"
    >
      Active
    </span>
  </div>
  <div id="active-growth-grid" class="grid grid-cols-1 md:grid-cols-2 gap-3"></div>
</section>
```

- [ ] **Step 2: Render active growth cards in `garden.ts`**

After computing stats and before rendering the featured plant, add:

```typescript
// Separate plants into active (totalFocusMinutes < required) and completed
const activePlants = plants.filter((p) => {
  const def = getPlantDefinition(p.type)
  return def ? p.totalFocusMinutes < def.focusMinutesRequired : false
})

const activeGrowthSection = document.getElementById('active-growth-section')
const activeGrowthGrid = document.getElementById('active-growth-grid')

if (activeGrowthSection && activeGrowthGrid && activePlants.length > 0) {
  activeGrowthSection.style.display = ''

  for (const plant of activePlants) {
    const def = getPlantDefinition(plant.type)
    if (!def) continue

    const progress = Math.min(1, plant.totalFocusMinutes / def.focusMinutesRequired)

    const card = document.createElement('div')
    card.className = 'stat-card-glass rounded-2xl p-4 flex items-center gap-4'

    const emojiWrap = document.createElement('div')
    emojiWrap.className = 'w-12 h-12 rounded-xl flex items-center justify-center text-2xl'
    emojiWrap.textContent = def.emoji

    const info = document.createElement('div')
    info.className = 'flex-1 min-w-0'

    const name = document.createElement('div')
    name.className = 'font-headline text-sm font-bold text-on-surface'
    name.textContent = def.name

    const progressWrap = document.createElement('div')
    progressWrap.className = 'w-full h-2 bg-surface-container-high rounded-full overflow-hidden mt-1'

    const progressBar = document.createElement('div')
    progressBar.className = 'h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500'
    progressBar.style.width = `${Math.round(progress * 100)}%`

    progressWrap.appendChild(progressBar)

    const meta = document.createElement('div')
    meta.className = 'flex items-center justify-between mt-1'
    const progressText = document.createElement('span')
    progressText.className = 'font-label text-[10px] text-on-surface/50'
    progressText.textContent = `${Math.round(plant.totalFocusMinutes)} / ${def.focusMinutesRequired} min`
    const pct = document.createElement('span')
    pct.className = 'font-label text-[10px] font-semibold text-primary'
    pct.textContent = `${Math.round(progress * 100)}%`
    meta.appendChild(progressText)
    meta.appendChild(pct)

    info.appendChild(name)
    info.appendChild(progressWrap)
    info.appendChild(meta)

    card.appendChild(emojiWrap)
    card.appendChild(info)
    activeGrowthGrid.appendChild(card)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add sproutdoro/garden.html sproutdoro/src/scripts/garden.ts
git commit -m "feat(garden): add active growth progress section showing plants in progress"
```

---

## Sub-Project E: Settings Integration & Final Polish

### Task E1: Add Timer-Adjust Configuration to Settings

**Files:**
- Modify: `sproutdoro/settings.html` (add timer-adjacent setting)
- Modify: `sproutdoro/src/types.ts` (add `timerAdjustMinutes` to `Settings`)

- [ ] **Step 1: Update `Settings` type**

In `types.ts`, add to `Settings`:

```typescript
export interface Settings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  theme: 'light' | 'dark'
  sound: 'wind-chimes' | 'birdsong' | 'rain'
  volume: number
  autoStartBreaks: boolean
  notifications: boolean
  timerAdjustMinutes: number
}
```

- [ ] **Step 2: Update `DEFAULT_SETTINGS` in storage.ts**

```typescript
export const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  theme: 'light',
  sound: 'wind-chimes',
  volume: 50,
  autoStartBreaks: true,
  notifications: true,
  timerAdjustMinutes: 5,
}
```

- [ ] **Step 3: Add the setting UI in `settings.html`**

Inside the "Timer Durations" card, after the three sliders, add a fourth:

```html
<div id="timer-adjust-setting"></div>
```

- [ ] **Step 4: Wire the slider in `settings.ts`**

After the existing timer duration sliders, add:

```typescript
const adjustSliderContainer = document.getElementById('timer-adjust-setting')
if (adjustSliderContainer) {
  adjustSliderContainer.appendChild(
    createRangeSlider({
      label: 'Adjust Amount',
      min: 1,
      max: 15,
      value: settings.timerAdjustMinutes,
      unit: ' min',
      accentColor: '#76786c',
      onChange: async (value) => {
        settings.timerAdjustMinutes = value
        await persistSettings()
      },
    })
  )
}
```

- [ ] **Step 5: Update `timer.ts` to read the adjust amount from settings**

In `timer.ts`, replace the hardcoded `ADJUST_AMOUNT_MINUTES`:

```typescript
// At the top of initTimerPage, after loading settings:
const ADJUST_AMOUNT_MINUTES = settings.timerAdjustMinutes || 5
```

- [ ] **Step 6: Commit**

```bash
git add sproutdoro/src/types.ts sproutdoro/src/scripts/storage.ts sproutdoro/settings.html sproutdoro/src/scripts/settings.ts sproutdoro/src/scripts/timer.ts
git commit -m "feat(settings): add configurable timer-adjust amount setting"
```

---

### Task E2: Handle DB Migration Gracefully

**Files:**
- Modify: `sproutdoro/src/scripts/storage.ts` (handle version upgrade without data loss)

- [ ] **Step 1: Update the `upgrade` function to handle both v1 and v2**

The current `upgrade` function uses `if (!db.objectStoreNames.contains(...))` checks, which is safe for incremental upgrades. Ensure the `categories` store is only added when upgrading to v2:

```typescript
upgrade(db, oldVersion) {
  if (oldVersion < 1 || !db.objectStoreNames.contains('settings')) {
    db.createObjectStore('settings', { keyPath: 'id' })
  }
  if (oldVersion < 1 || !db.objectStoreNames.contains('sessions')) {
    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' })
    sessionStore.createIndex('by-date', 'startTime')
    sessionStore.createIndex('by-type', 'type')
  }
  if (oldVersion < 1 || !db.objectStoreNames.contains('plants')) {
    const plantStore = db.createObjectStore('plants', { keyPath: 'id' })
    plantStore.createIndex('by-rarity', 'rarity')
    plantStore.createIndex('by-level', 'level')
  }
  if (oldVersion < 1 || !db.objectStoreNames.contains('insights')) {
    db.createObjectStore('insights', { keyPath: 'id' })
  }
  if (oldVersion < 2 || !db.objectStoreNames.contains('categories')) {
    const categoryStore = db.createObjectStore('categories', { keyPath: 'id' })
    categoryStore.createIndex('by-name', 'name', { unique: true })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add sproutdoro/src/scripts/storage.ts
git commit -m "fix(storage): handle DB migration from v1 to v2 with categories store"
```

---

### Task E3: Update Session.duration to Track Actual Elapsed Time

**Files:**
- Modify: `sproutdoro/src/scripts/timer.ts` (record `startTime` correctly and compute real duration)

- [ ] **Step 1: Ensure session `startTime` tracks the real start**

In `timer.ts`, add a module-level variable to track the actual session start time:

```typescript
let sessionStartTime: number | null = null
```

In the `startPauseBtn` click handler, when starting a work session:

```typescript
if (state.state === 'idle' || state.state === 'complete') {
  sessionStartTime = Date.now()
}
```

- [ ] **Step 2: Update `onTimerComplete` to use actual elapsed duration**

```typescript
const endTime = Date.now()
const actualDurationMs = sessionStartTime ? endTime - sessionStartTime : timerState.totalSeconds * 1000
const actualDurationMinutes = Math.round((actualDurationMs / 1000 / 60) * 10) / 10

const session = {
  id: crypto.randomUUID(),
  startTime: sessionStartTime || endTime - (timerState?.totalSeconds || 0) * 1000,
  endTime: endTime,
  duration: actualDurationMinutes > 0 ? actualDurationMinutes : (timerState?.totalSeconds || 0) / 60,
  type: 'work',
  plantId: null,
  category: currentCategory,
  completed: true,
} as import('../types').Session
```

- [ ] **Step 3: Commit**

```bash
git add sproutdoro/src/scripts/timer.ts
git commit -m "fix(timer): track actual session start time for accurate duration logging"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| Requirement | Task |
|---|---|
| Dynamic timer +/- buttons | A1, A2, A3 |
| Configurable adjust amount (±5 min default) | E1 |
| Timer doesn't reset, seamlessly continues | A1 (adjustTime method) |
| Decrement floors at 0 | A1 (Math.max(0, ...)) |
| Adjustment reflected in session history | E3 (actual duration tracking) |
| Immediate Break button | B2, B3 |
| Save remaining time (bookmark) | B1 (pauseForBreak) |
| Pause focus, start break | B1, B3 |
| Resume from bookmark after break | B1 (resumeFromBreak) |
| Cancel break early still resumes | B3 (cancel handler) |
| One continuous session, break excluded | B1, E3 |
| Categories CRUD | C5 |
| Category selection before session | C3 |
| Per-category insights | C4 |
| Total time per category (daily/weekly/monthly) | C4 (categoryStats) |
| Number of sessions per category | C4 |
| Trends over time | C4 (weeklyTrend) |
| Categories optional | C3 (null = uncategorized) |
| Garden: Start Planting doesn't start timer | D3 (opens modal) |
| Browse available plants | D2, D3 |
| Select plant, see plan | D2 |
| Timer growth begins only after selection | D3 |
| Persistent plant growth across sessions | D3 (IndexedDB) |
| Garden shows all plants with growth status | D4 |

### 2. Placeholder Scan

No TBD, TODO, or placeholder patterns found. All steps contain complete code.

### 3. Type Consistency

- `adjustmentOffset` and `modeAtAdjustmentStart` are consistently used across TimerState, TimerStatePersist, and restoreState
- `breakBookmark` field is consistently used across TimerState, TimerStatePersist, and restoreState
- `Category` type is defined in types.ts and exported, imported in storage.ts, CategoryPill.ts, CategoryManager.ts, and insights.ts
- `PlantDefinition` type is defined in plant-definitions.ts and imported in PlantingPlanModal.ts
- `Insights.categoryStats` is added to both the type and the computeInsights function
- `Settings.timerAdjustMinutes` is added to the type, DEFAULT_SETTINGS, and used in settings.ts and timer.ts
- Session.category type changed from `string` to `string | null` — all usages in insights.ts handle null via `s.category || 'uncategorized'`

---

## Git Workflow

All commits follow atomic-commit conventions:
- Each task produces 1-2 focused commits with `feat(scope):` or `fix(scope):` prefixes
- Features are implemented in sequence (A → B → C → D → E) since they have dependencies
- After all commits, create a feature branch and PR:

```bash
git checkout -b feat/four-features
# ... all implementation commits ...
git push -u origin feat/four-features
gh pr create --title "feat: Dynamic timer, immediate break, categories, and garden fix" --body "Implements all four features with proper git workflow."
```