import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Timer } from '../src/scripts/timer-engine'
import type { Settings } from '../src/types'

const settings: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  theme: 'light',
  sound: 'wind-chimes',
  volume: 50,
  autoStartBreaks: false,
  notifications: false,
  timerAdjustMinutes: 5,
}

describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in idle work mode with correct duration', () => {
    const timer = new Timer(settings, () => {}, () => {})
    const state = timer.getState()
    expect(state.mode).toBe('work')
    expect(state.state).toBe('idle')
    expect(state.remainingSeconds).toBe(25 * 60)
  })

  it('transitions to running on start', () => {
    const timer = new Timer(settings, () => {}, () => {})
    timer.start()
    expect(timer.getState().state).toBe('running')
  })

  it('pauses and resumes', () => {
    const timer = new Timer(settings, () => {}, () => {})
    timer.start()
    timer.pause()
    expect(timer.getState().state).toBe('paused')
    timer.resume()
    expect(timer.getState().state).toBe('running')
  })

  it('counts down while running', () => {
    const updates: number[] = []
    const timer = new Timer(settings, (s) => updates.push(s.remainingSeconds), () => {})
    timer.start()
    vi.advanceTimersByTime(3000)
    expect(timer.getState().remainingSeconds).toBe(25 * 60 - 3)
  })

  it('calls onComplete when timer reaches zero', () => {
    const onComplete = vi.fn()
    const shortSettings = { ...settings, workDuration: 1 / 60 }
    const timer = new Timer(shortSettings, () => {}, onComplete)
    timer.start()
    vi.advanceTimersByTime(2000)
    expect(onComplete).toHaveBeenCalledWith('work')
  })

  it('resets to idle with full duration', () => {
    const timer = new Timer(settings, () => {}, () => {})
    timer.start()
    vi.advanceTimersByTime(5000)
    timer.reset()
    const state = timer.getState()
    expect(state.state).toBe('idle')
    expect(state.remainingSeconds).toBe(state.totalSeconds)
  })

  it('adjusts time during active session', () => {
    const timer = new Timer(settings, () => {}, () => {})
    timer.start()
    const before = timer.getState().remainingSeconds
    timer.adjustTime(60)
    expect(timer.getState().remainingSeconds).toBe(before + 60)
  })
})
