// Local-first persistence. localStorage is the immediate source of truth;
// optional cloud sync (M3) merges on top of these same shapes.

export interface ProgressData {
  version: 1
  /** Highest level id the player has unlocked (0 = only first level). */
  maxUnlocked: number
  /** Best completion time per level id, in ms. */
  bestTimes: Record<number, number>
}

export interface SettingsData {
  muted: boolean
}

const PROGRESS_KEY = 'rinse.progress.v1'
const SETTINGS_KEY = 'rinse.settings.v1'

const defaultProgress: ProgressData = {
  version: 1,
  maxUnlocked: 0,
  bestTimes: {},
}

const defaultSettings: SettingsData = { muted: false }

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full / disabled — non-fatal for a stress-relief toy */
  }
}

export function loadProgress(): ProgressData {
  return read(PROGRESS_KEY, defaultProgress)
}

export function saveProgress(p: ProgressData): void {
  write(PROGRESS_KEY, p)
}

/** Mark a level complete: unlock the next one and keep the best time. */
export function completeLevel(
  levelId: number,
  timeMs: number,
  totalLevels: number,
): ProgressData {
  const p = loadProgress()
  const next = Math.min(totalLevels - 1, levelId + 1)
  p.maxUnlocked = Math.max(p.maxUnlocked, next)
  const prev = p.bestTimes[levelId]
  if (prev === undefined || timeMs < prev) p.bestTimes[levelId] = timeMs
  saveProgress(p)
  return p
}

export function loadSettings(): SettingsData {
  return read(SETTINGS_KEY, defaultSettings)
}

export function saveSettings(s: SettingsData): void {
  write(SETTINGS_KEY, s)
}
