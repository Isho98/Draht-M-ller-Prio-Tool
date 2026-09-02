export type WindowPreset = 'fullscreen' | '1280' | '1440' | '1920' | 'custom'

export type AppSettings = {
  windowPreset: WindowPreset
  windowWidth: number
  windowHeight: number
  saveLocationName: string
  language: 'de'
  telemetry: boolean
  masterKey: string
  licenseKey: string
  logoDataUrl: string | null
}

export const DEFAULT_SETTINGS: AppSettings = {
  windowPreset: 'fullscreen',
  windowWidth: 1440,
  windowHeight: 900,
  saveLocationName: '',
  language: 'de',
  telemetry: false,
  masterKey: '',
  licenseKey: '',
  logoDataUrl: null,
}

export const WINDOW_PRESETS: { id: WindowPreset; label: string; width?: number; height?: number }[] = [
  { id: 'fullscreen', label: 'Vollbild' },
  { id: '1280', label: '1280 × 800', width: 1280, height: 800 },
  { id: '1440', label: '1440 × 900', width: 1440, height: 900 },
  { id: '1920', label: '1920 × 1080', width: 1920, height: 1080 },
  { id: 'custom', label: 'Benutzerdefiniert' },
]

export const LANGUAGES = [{ id: 'de' as const, label: 'Deutsch' }]

const STORAGE_KEY = 'adept-prioritization-settings'

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return { ...DEFAULT_SETTINGS, ...parsed, language: 'de' }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    window.dispatchEvent(new Event('adept-settings-changed'))
  } catch {
    window.dispatchEvent(new CustomEvent('adept-settings-error', {
      detail: 'Einstellungen konnten nicht gespeichert werden. Speicherplatz oder Browserrechte prüfen.',
    }))
  }
}
