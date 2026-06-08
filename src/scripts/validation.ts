import type { Settings } from '../types'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/
const CONTROL_CHAR_RE = /[\x00-\x1f\x7f]/

export interface TimerStatePersist {
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

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function sanitizeCategoryName(name: string): string {
  return name.replace(CONTROL_CHAR_RE, '').trim().slice(0, 40)
}

export function sanitizeColor(color: string, fallback = '#76786c'): string {
  return HEX_COLOR_RE.test(color) ? color : fallback
}

export function parseSettings(raw: Partial<Settings> | null | undefined): Settings {
  const defaults: Settings = {
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

  if (!raw || typeof raw !== 'object') return defaults

  const sound = raw.sound
  const validSound =
    sound === 'wind-chimes' || sound === 'birdsong' || sound === 'rain' ? sound : defaults.sound

  return {
    workDuration: clamp(Number(raw.workDuration) || defaults.workDuration, 1, 60),
    shortBreakDuration: clamp(Number(raw.shortBreakDuration) || defaults.shortBreakDuration, 1, 15),
    longBreakDuration: clamp(Number(raw.longBreakDuration) || defaults.longBreakDuration, 5, 45),
    theme: raw.theme === 'dark' ? 'dark' : 'light',
    sound: validSound,
    volume: clamp(Number(raw.volume) ?? defaults.volume, 0, 100),
    autoStartBreaks: raw.autoStartBreaks !== false,
    notifications: raw.notifications !== false,
    timerAdjustMinutes: clamp(Number(raw.timerAdjustMinutes) || defaults.timerAdjustMinutes, 1, 15),
  }
}

export function parseTimerState(raw: unknown): TimerStatePersist | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>

  const modes = ['work', 'shortBreak', 'longBreak'] as const
  const states = ['idle', 'running', 'paused', 'onBreak', 'complete'] as const

  if (!modes.includes(s.mode as typeof modes[number])) return null
  if (!states.includes(s.state as typeof states[number])) return null

  const remaining = Number(s.remainingSeconds)
  const total = Number(s.totalSeconds)
  if (!Number.isFinite(remaining) || !Number.isFinite(total)) return null

  let breakBookmark: TimerStatePersist['breakBookmark'] = null
  if (s.breakBookmark && typeof s.breakBookmark === 'object') {
    const b = s.breakBookmark as Record<string, unknown>
    if (modes.includes(b.mode as typeof modes[number])) {
      breakBookmark = {
        remainingSeconds: Number(b.remainingSeconds) || 0,
        totalSeconds: Number(b.totalSeconds) || 0,
        mode: b.mode as 'work' | 'shortBreak' | 'longBreak',
        adjustmentOffset: Number(b.adjustmentOffset) || 0,
      }
    }
  }

  return {
    mode: s.mode as TimerStatePersist['mode'],
    state: s.state as TimerStatePersist['state'],
    remainingSeconds: clamp(remaining, 0, 24 * 60 * 60),
    totalSeconds: clamp(total, 1, 24 * 60 * 60),
    sessionCount: clamp(Number(s.sessionCount) || 0, 0, 10000),
    lastTick: typeof s.lastTick === 'number' ? s.lastTick : null,
    adjustmentOffset: Number(s.adjustmentOffset) || 0,
    modeAtAdjustmentStart: modes.includes(s.modeAtAdjustmentStart as typeof modes[number])
      ? (s.modeAtAdjustmentStart as TimerStatePersist['modeAtAdjustmentStart'])
      : null,
    breakBookmark,
  }
}
