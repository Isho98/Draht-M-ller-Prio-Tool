import { DEFAULT_FEINPLANUNG_SETTINGS, mergeFeinplanungSettings, type FeinplanungSettings } from './settings'

export const FEINPLANUNG_SETTINGS_STORAGE_KEY = 'adept-produktionspriorisierung-settings'

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
