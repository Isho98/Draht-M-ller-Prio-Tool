import { DEFAULT_FEINPLANUNG_SETTINGS, mergeFeinplanungSettings, type FeinplanungSettings } from './settings'
import type { PlanningOrder } from './types'

export const FEINPLANUNG_SETTINGS_STORAGE_KEY = 'adept-produktionspriorisierung-settings'
export const FEINPLANUNG_SESSION_KEY = 'adept-produktionspriorisierung-session'

export type PlanningSession = {
  jobId: string
  fileName: string
  sheetName: string
  rowCount: number
  openCount?: number
  completedCount?: number
  columns: string[]
  doneColumns?: string[]
  orders: PlanningOrder[]
}

export function readLocalFeinplanungSettings(): FeinplanungSettings | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(FEINPLANUNG_SETTINGS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<FeinplanungSettings>
    return mergeFeinplanungSettings(DEFAULT_FEINPLANUNG_SETTINGS, parsed)
  } catch {
    return null
  }
}

export function writeLocalFeinplanungSettings(settings: FeinplanungSettings): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FEINPLANUNG_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Private mode / quota: calculation still uses in-memory settings.
  }
}

export function readPlanningSession(): PlanningSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(FEINPLANUNG_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlanningSession
    if (!parsed?.orders?.length) return null
    return parsed
  } catch {
    return null
  }
}

export function writePlanningSession(session: PlanningSession): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(FEINPLANUNG_SESSION_KEY, JSON.stringify(session))
  } catch {
    // ignore quota
  }
}

export function clearPlanningSession(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(FEINPLANUNG_SESSION_KEY)
  } catch {
    // ignore
  }
}
