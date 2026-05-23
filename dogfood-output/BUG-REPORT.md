# Sproutdoro Bug Report
**Version:** 2.4.0  
**URL:** http://localhost:5173  
**Date:** 2026-05-23  
**Total Issues Found:** 17  

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High     | 3 |
| Medium   | 7 |
| Low      | 4 |

---

## Critical

### ISSUE-001: Audio Files Missing — All Sound Features Broken

**Severity:** Critical  
**Category:** Audio  
**Repro Video:** N/A  
**Repro Screenshot:** `dogfood-output/screenshots/initial.png`

**Description:**  
The audio system fails on every page load. Three sound files referenced by the `AudioManager` do not exist in the `/sounds/` directory:

- `/sounds/break.mp3`
- `/sounds/completion.mp3`
- `/sounds/wind-chimes.mp3`

**Repro Steps:**
1. Open `http://localhost:5173/`
2. Open the browser console

**Expected:** No console warnings.
**Actual:** Three warnings logged: `Failed to preload sound "break"/"completion"/"wind-chimes"`.

**Root Cause:**  
`timer.ts:42` calls `audioManager.loadSound(name, '/sounds/${name}.mp3')` but no `/sounds/` directory with `.mp3` files exists in the `public/` folder (or `sproutdoro/` root).

**Fix:** Either add the MP3 files to `sproutdoro/public/sounds/` or implement synthesized fallback audio (the `AudioManager` has `synthesizeAmbient` methods that would work if `loadSound` failure triggered synthesis).

---

### ISSUE-002: Timer State Lost on Page Navigation

**Severity:** Critical  
**Category:** Timer / State  
**Repro Screenshot:** N/A  
**Repro Video:** N/A  

**Description:**  
When the timer is running and the user navigates to another page (e.g., Garden, Settings), the timer stops running. On returning to the timer page, it shows the default reset state rather than resuming.

**Repro Steps:**
1. Open `http://localhost:5173/`
2. Start the timer (click the play button)
3. Wait for the timer to decrement a few seconds
4. Navigate to any other page (e.g., click "Garden" in the sidebar)
5. Return to `http://localhost:5173/`

**Expected:** Timer resumes from where it left off, or at minimum shows a paused state.
**Actual:** Timer is at full 25:00, as if it never ran.

**Root Cause:**  
`Timer` is a local class instance created on page load in `timer.ts:271`. Navigation kills the page script context. No session persistence using `sessionStorage`, `localStorage`, or the service worker scope exists for timer state.

**Fix:** Save timer state (`mode`, `remainingSeconds`, `sessionCount`, `state`) to `sessionStorage` on each tick and restore from it on page load.

---

### ISSUE-003: Dark Theme Setting Saved But Not Applied

**Severity:** Critical  
**Category:** Settings / Theme  
**Repro Screenshot:** `dogfood-output/screenshots/settings-after-dark-reload.png`  

**Description:**  
Selecting "Dark" theme on the Settings page updates the button styling and persists the `theme: 'dark'` value to IndexedDB, but the theme is never actually applied to the DOM (no `.dark` class on `<html>`). After page reload, the "Dark" button is visually selected but the page remains light.

**Repro Steps:**
1. Open `http://localhost:5173/settings.html`
2. Click the "Dark" button under Appearance
3. Observe: page remains light
4. Reload the page or navigate to another page and back

**Expected:** The dark theme class is applied, changing the color scheme.
**Actual:** `document.documentElement.classList` remains empty — no `dark` class is ever added/removed.

**Root Cause:**  
`settings.ts:137-150` updates button classes and persists to DB but never calls `document.documentElement.classList.add('dark')` or `remove('dark')`. No code in any page's init function reads `settings.theme` from DB and applies it to the DOM.

**Fix:** Add `document.documentElement.classList.toggle('dark', theme === 'dark')` in `setTheme()`, and call `setTheme(settings.theme)` during page init on every page (not just settings page).

---

## High

### ISSUE-004: Sidebar "Start Session" CTA Button Does Nothing

**Severity:** High  
**Category:** Navigation / UX  
**Repro Screenshot:** `dogfood-output/screenshots/initial.png` (see sidebar button labeled "play_arrow Start Session")  

**Description:**  
The prominent "Start Session" button in the sidebar (`SideNav.ts`) has no `click` event listener attached. It is a visual element only. Clicking it has zero effect.

**Repro Steps:**
1. Open any page in the app
2. Click the "Start Session" button in the left sidebar

**Expected:** Either navigates to the timer page and starts a session, or equivalent action.
**Actual:** Nothing happens.

**Root Cause:**  
`SideNav.ts:42-49` creates the button element but never attaches a `click` event handler. The button is purely decorative.

**Fix:** Add an event listener that navigates to `index.html` and optionally auto-starts the timer (e.g., via URL hash `#start`).

---

### ISSUE-005: Pie Chart Center Overlay Positioned Incorrectly

**Severity:** High  
**Category:** Layout / Insights  
**Repro Screenshot:** N/A (no data to render, but code is clearly wrong)  

**Description:**  
`insights.ts` creates a center overlay div with `position: absolute; inset: 0` inside the pie chart's parent container, but the parent lacks `position: relative`. This means the overlay positions relative to the nearest positioned ancestor rather than the chart container, causing it to be misplaced.

**Repro Steps:**
1. Complete at least one work session in different categories
2. Navigate to Insights page
3. Observe the pie chart center overlay

**Expected:** Overlay centered inside the chart.
**Actual:** Overlay may appear at a wrong position or fall outside the visible chart area.

**Root Cause:**  
`insights.ts` — the parent `container` for `centerOverlay` has no `position: relative` set (via class or inline).

**Fix:** Add `container.classList.add('relative')` or set `position: relative` on the wrapper.

---

### ISSUE-006: CDP Click Events Don't Reach Timer Buttons

**Severity:** High  
**Category:** Interaction / CDP Compatibility  
**Repro Screenshot:** N/A  

**Description:**  
The timer play/pause button (`#btn-start-pause`) responds to `dispatchEvent(new MouseEvent('click'))` but not to CDP-level clicks (as sent by Puppeteer/Playwright/agent-browser). This means programmatic click simulation (for testing/E2E) silently fails.

**Repro Steps:**
1. Open the timer page
2. Use a CDP-based tool to click the element `#btn-start-pause`
3. Observe timer does not start

**Expected:** Timer starts.
**Actual:** Timer remains idle.

**Root Cause:**  
The button itself has no event listener — `timer.ts:276` uses `addEventListener('click', ...)`. CDP click may be targeting the inner `<span>` (the icon) rather than the button, or the event propagation is blocked by the `pointer-events-none` on the sprout image overlay.

**Fix:** Verify there is no blocking overlay over the button. Consider adding `pointer-events: auto` where needed.

---

## Medium

### ISSUE-007: Unhandled IndexedDB Write Errors

**Severity:** Medium  
**Category:** Data Persistence  
**Repro Screenshot:** N/A  

**Description:**  
`saveSettings`, `createSession`, `createPlant`, `updatePlant`, and `updateInsights` in `storage.ts` call IndexedDB write operations without try/catch. An IndexedDB quota exceeded, transaction failure, or corruption error propagates as an unhandled promise rejection.

**Repro Steps:**
1. Fill the browser storage quota (or simulate transaction failure)
2. Complete a work session

**Expected:** Graceful error handling with user feedback.
**Actual:** Unhandled promise rejection in console; data silently lost.

**Root Cause:**  
`storage.ts` lacks error handling wrappers for write operations.

**Fix:** Wrap write functions in try/catch, log errors appropriately, and surface to UI where relevant.

---

### ISSUE-008: Achievement `unlockedAt` Always Set to Current Time

**Severity:** Medium  
**Category:** Gamification / Data Integrity  
**Repro Screenshot:** `dogfood-output/screenshots/insights-page.png`  

**Description:**  
`insights.ts:computeAchievements` sets `achievement.unlockedAt = Date.now()` for every newly unlocked achievement. This means the timestamp stored is the time of page load (computation), not the time the achievement was actually earned. If a user earns the "First Sprout" achievement on Monday but opens Insights on Friday, it shows Friday's date.

**Repro Steps:**
1. Complete a work session (triggers achievement computation)
2. Wait several hours
3. Visit the Insights page

**Expected:** Achievement shows the time it was actually earned.
**Actual:** Achievement shows current time on every page load.

**Root Cause:**  
`insights.ts` uses `Date.now()` instead of the session's timestamp when checking if an achievement should be unlocked.

**Fix:** Track the session's `endTime` as the achievement timestamp, or check if the achievement was previously unlocked and keep its existing timestamp.

---

### ISSUE-009: Double Fetch of Plants in Garden Page

**Severity:** Medium  
**Category:** Performance  
**Repro Screenshot:** N/A  

**Description:**  
`garden.ts` calls `getAllPlants()` on line 24 and then calls `getFeaturedPlant()` which internally calls `getAllPlants()` again. This doubles the IndexedDB read operations.

**Repro Steps:**
1. Open garden page with plants in the DB
2. Observe browser DevTools network/storage tab for double reads

**Expected:** Single fetch.
**Actual:** Double fetch.

**Fix:** Pass `plants` from the first `getAllPlants()` call to `getFeaturedPlant()` or refactor to accept an existing array.

---

### ISSUE-010: Rapid Double-Click on Play Button Causes Undefined State

**Severity:** Medium  
**Category:** Timer / UX  
**Repro Screenshot:** N/A  

**Description:**  
Clicking the play/pause button twice rapidly (pause → start → pause or start → pause → start) within the same tick creates unexpected behavior. The timer may appear stuck or transition incorrectly.

**Repro Steps:**
1. Start the timer
2. Double-click the play/pause button rapidly

**Expected:** Clean toggle between pause/play.
**Actual:** Potential state inconsistency.

**Root Cause:**  
`start()` guards on `state !== 'running'` and `pause()` guards on `state === 'running'`, but rapid clicks within a single event loop tick can pass both guards.

**Fix:** Debounce the click handler or add a `transitioning` flag.

---

### ISSUE-011: CircularProgress Crashes With Zero/Negative Radius

**Severity:** Medium  
**Category:** Components  
**Repro Screenshot:** N/A  

**Description:**  
If `size <= strokeWidth`, the calculated `radius` (`(size - strokeWidth) / 2`) becomes zero or negative, producing `NaN` in circumference calculations. The SVG will be visually broken.

**Repro Steps:**
1. Call `createCircularProgress({ size: 5, strokeWidth: 5 })`

**Expected:** Error handling or minimum clamping.
**Actual:** NaN values in SVG attributes.

**Fix:** Add `Math.max(0, (size - strokeWidth) / 2)` guard.

---

### ISSUE-012: RangeSlider Division by Zero

**Severity:** Medium  
**Category:** Components  
**Repro Screenshot:** N/A  

**Description:**  
`RangeSlider.ts:getGradientPercent` computes `((value - min) / (max - min)) * 100`. If `min === max`, the result is `Infinity` or `NaN`, breaking the gradient style.

**Repro Steps:**
1. Programmatically create a RangeSlider with `min === max`

**Expected:** Graceful handling.
**Actual:** NaN gradient.

**Fix:** Guard with `if (min >= max) return 50;` or similar.

---

### ISSUE-013: Untracked Oscillator Nodes in Audio Synthesizer

**Severity:** Medium  
**Category:** Audio / Memory  
**Repro Screenshot:** N/A  

**Description:**  
In `audio.ts`, the wind chimes and birdsong synthesizers create oscillator nodes inside `setInterval` callbacks without pushing them to `ambientNodes[]`. When `stopAmbient()` is called, only pre-existing nodes are stopped — new oscillators may continue playing briefly and are never explicitly stopped.

**Repro Steps:**
1. Start "wind chimes" ambient sound
2. Call `stopAmbient()` immediately after a chime note started
3. Note: the currently playing oscillator may continue until its natural end

**Fix:** Track all oscillator nodes in `ambientNodes` array.

---

## Low

### ISSUE-014: Accessibility Attributes Missing Across Components

**Severity:** Low  
**Category:** Accessibility  
**Repro Screenshot:** N/A  

**Description:**  
Multiple components lack proper ARIA attributes:
- `SideNav.ts`: `<nav>` has no `aria-label`; button has no `aria-label`
- `MobileNav.ts`: `<nav>` has no `aria-label`; FAB link has no `aria-label`
- `ToggleSwitch.ts`: Checkbox missing `role="switch"`, `aria-checked`, `aria-label`
- `SoundCard.ts`: Button missing `aria-pressed` to convey selection state
- `insights.ts`: Pie chart SVG missing `role="img"` and `aria-label`

**Fix:** Add appropriate ARIA attributes to all interactive and structural elements.

---

### ISSUE-015: Sound Selection UI Feedback Incomplete

**Severity:** Low  
**Category:** UX  
**Repro Screenshot:** `dogfood-output/screenshots/settings-sound-select.png`  

**Description:**  
Clicking a sound card updates the visual selection state (highlight ring), but there is no confirmation message or audio preview. Users have no feedback beyond the visual ring change.

**Fix:** Play a short preview sample of the selected sound, or show a brief "Selected" toast message.

---

### ISSUE-016: Excessive Console Log Messages

**Severity:** Low  
**Category:** Dev Experience  
**Repro Screenshot:** `dogfood-output/screenshots/initial.png`  

**Description:**  
On every page load, multiple `[debug] [vite] connecting...` and `[debug] [vite] connected.` messages appear in the console. In production builds this would be cleaned up, but during development it clutters the console and makes spotting real errors difficult.

**Fix:** Suppress Vite debug logs in dev mode or configure `logLevel` in `vite.config.ts`.

---

### ISSUE-017: Timer Page Stats Reset on Reload Despite Persisted Data

**Severity:** Low  
**Category:** UX / Data  
**Repro Screenshot:** `dogfood-output/screenshots/timer-running.png`  

**Description:**  
After completing a work session and refreshing the timer page, the "Growth Stage" stat resets to "Seedling" and "Today's Focus" resets to "0h 0m" even if yesterday's data was saved. This happens because these stats are hardcoded or computed from `getTodaySessions()` which filters by calendar date.

**Fix:** Consider showing lifetime stats alongside daily stats, or compute growth stage from total lifetime focus hours.
