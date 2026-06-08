# Sproutdoro Architecture

Sproutdoro is a static multi-page web app (no backend). Each screen is an HTML entry point with its own TypeScript bootstrap script.

## Pages

| Page | Entry | Script |
|------|-------|--------|
| Focus (timer) | `index.html` | `src/scripts/timer.ts` |
| Garden | `garden.html` | `src/scripts/garden.ts` |
| Insights | `insights.html` | `src/scripts/insights.ts` |
| Settings | `settings.html` | `src/scripts/settings.ts` |
| Privacy | `privacy.html` | `src/scripts/legal.ts` |
| Terms | `terms.html` | `src/scripts/legal.ts` |

Shared UI: `SideNav`, `MobileNav`, `SiteFooter`, theme system, IndexedDB storage layer.

## Data model (IndexedDB: `sproutdoro-db`)

| Store | Key | Contents |
|-------|-----|----------|
| `settings` | `default` | Timer durations, theme, sound, notifications |
| `sessions` | `id` | Completed focus/break sessions |
| `plants` | `id` | Garden plants with level and focus minutes |
| `categories` | `id` | Focus category labels, colors, icons |
| `insights` | `default` | Computed on read from sessions/plants |

## Core flows

1. **Plant** — User picks a seed in Garden (`createPlant`)
2. **Focus** — Timer runs work sessions; on complete, minutes attribute to active plant (`getActivePlant`, `updatePlant`)
3. **Grow** — Plant levels up when `totalFocusMinutes` crosses thresholds in `plant-definitions.ts`
4. **Insights** — `getInsights()` aggregates sessions and plants into streaks, charts, achievements

## Timer state

Active timer state persists in `sessionStorage` (`sproutdoro-timer-state`) so navigation between pages does not reset the clock.

## Build & deploy

- Vite multi-page build → `dist/`
- Production base path: `/sproutdoro-V2/` (GitHub Pages project site)
- GitHub Actions: CI on PR, deploy on push to `main`
