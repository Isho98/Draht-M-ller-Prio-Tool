'use client'

import { useId, useState } from 'react'
import { X } from 'lucide-react'
import { useAppState } from '@/components/app-state'
import { IconButton } from '@/components/ui/icon-button'
import { SettingsField, fieldControlClass } from '@/components/ui/settings-field'
import { persistDirectoryHandle } from '@/lib/fs-export'
import { LANGUAGES, WINDOW_PRESETS, type WindowPreset } from '@/lib/settings'
import { APP_VERSION } from '@/lib/version'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'general', label: 'Allgemein' },
  { id: 'display', label: 'Anzeige & Design' },
  { id: 'privacy', label: 'Datenschutz & Sicherheit' },
  { id: 'updates', label: 'Updates & Info' },
] as const

type TabId = (typeof TABS)[number]['id']

type Props = {
  onClose: () => void
}

export function SettingsModal({ onClose }: Props) {
  const { settings, updateSettings } = useAppState()
  const [tab, setTab] = useState<TabId>('general')
  const [browseError, setBrowseError] = useState<string | null>(null)
  const logoId = useId()
  const widthId = useId()
  const heightId = useId()
  const pathId = useId()
  const langId = useId()
  const keyId = useId()
  const licenseId = useId()
  const versionId = useId()
  const presetId = useId()

  async function handleBrowse() {
    setBrowseError(null)
    const picker = window.showDirectoryPicker
    if (!picker) {
      setBrowseError('Ordnerauswahl ist in diesem Browser nicht verfügbar.')
      return
    }
    try {
      const handle = await picker()
      await persistDirectoryHandle(handle)
      updateSettings({ saveLocationName: handle.name })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setBrowseError('Der Ordner konnte nicht ausgewählt werden.')
    }
  }

  function handlePreset(preset: WindowPreset) {
    const found = WINDOW_PRESETS.find((item) => item.id === preset)
    updateSettings({
      windowPreset: preset,
      ...(found?.width ? { windowWidth: found.width } : {}),
      ...(found?.height ? { windowHeight: found.height } : {}),
    })
  }

  function handleLogo(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') updateSettings({ logoDataUrl: reader.result })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-8">
      <button type="button" className="absolute inset-0 bg-black/30" aria-label="Schließen" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative z-10 flex max-h-[min(720px,calc(100svh-64px))] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-8">
          <h2 id="settings-title" className="text-lg font-medium tracking-tight">
            Einstellungen
          </h2>
          <IconButton label="Einstellungen schließen" onClick={onClose}>
            <X className="size-5" strokeWidth={1.5} />
          </IconButton>
        </div>

        <div className="grid h-10 shrink-0 grid-cols-4 border-y border-border px-8">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'h-10 text-[13px] transition-colors duration-200 ease-in-out',
                tab === item.id
                  ? 'border-b-2 border-foreground font-medium text-foreground'
                  : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          {tab === 'general' ? (
            <div className="flex flex-col gap-6">
              <SettingsField label="Fenstergröße" htmlFor={presetId}>
                <select
                  id={presetId}
                  className={fieldControlClass}
                  value={settings.windowPreset}
                  onChange={(e) => handlePreset(e.target.value as WindowPreset)}
                >
                  {WINDOW_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </SettingsField>
              <SettingsField label="Breite (px)" htmlFor={widthId}>
                <input
                  id={widthId}
                  type="number"
                  min={800}
                  max={3840}
                  className={fieldControlClass}
                  value={settings.windowWidth}
                  onChange={(e) =>
                    updateSettings({
                      windowWidth: Number(e.target.value) || 0,
                      windowPreset: 'custom',
                    })
                  }
                />
              </SettingsField>
              <SettingsField label="Höhe (px)" htmlFor={heightId}>
                <input
                  id={heightId}
                  type="number"
                  min={600}
                  max={2160}
                  className={fieldControlClass}
                  value={settings.windowHeight}
                  onChange={(e) =>
                    updateSettings({
                      windowHeight: Number(e.target.value) || 0,
                      windowPreset: 'custom',
                    })
                  }
                />
              </SettingsField>
              <SettingsField label="Standard-Speicherort" htmlFor={pathId}>
                <div className="flex gap-2">
                  <input
                    id={pathId}
                    type="text"
                    readOnly
                    placeholder="Kein Ordner gewählt"
                    className={cn(fieldControlClass, 'flex-1')}
                    value={settings.saveLocationName}
                  />
                  <button
                    type="button"
                    onClick={handleBrowse}
                    className="h-10 shrink-0 rounded-[var(--radius-button)] border border-border bg-background px-4 text-sm transition-colors duration-200 ease-in-out hover:bg-secondary"
                  >
                    Durchsuchen...
                  </button>
                </div>
              </SettingsField>
              {browseError ? (
                <p className="settings-field-error text-sm text-[var(--color-error)]">{browseError}</p>
              ) : null}
            </div>
          ) : null}

          {tab === 'display' ? (
            <div className="flex flex-col gap-6">
              <SettingsField label="Sprache" htmlFor={langId}>
                <select
                  id={langId}
                  className={fieldControlClass}
                  value={settings.language}
                  onChange={() => updateSettings({ language: 'de' })}
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </SettingsField>
              <SettingsField label="Firmenlogo" htmlFor={logoId}>
                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-button)] border border-border bg-secondary">
                    {settings.logoDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={settings.logoDataUrl} alt="Firmenlogo" className="size-full object-contain" />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Logo</span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 gap-2">
                    <label
                      htmlFor={logoId}
                      className="flex h-10 cursor-pointer items-center rounded-[var(--radius-button)] border border-border bg-background px-4 text-sm transition-colors duration-200 ease-in-out hover:bg-secondary"
                    >
                      Hochladen
                    </label>
                    <input
                      id={logoId}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="sr-only"
                      onChange={(e) => handleLogo(e.target.files?.[0])}
                    />
                    {settings.logoDataUrl ? (
                      <button
                        type="button"
                        onClick={() => updateSettings({ logoDataUrl: null })}
                        className="h-10 rounded-[var(--radius-button)] px-4 text-sm text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-secondary hover:text-foreground"
                      >
                        Entfernen
                      </button>
                    ) : null}
                  </div>
                </div>
              </SettingsField>
            </div>
          ) : null}

          {tab === 'privacy' ? (
            <div className="flex flex-col gap-6">
              <SettingsField label="Diagnosedaten" htmlFor="telemetry">
                <label className="flex h-10 items-center gap-3 text-sm">
                  <input
                    id="telemetry"
                    type="checkbox"
                    className="size-4 rounded border-border accent-foreground"
                    checked={settings.telemetry}
                    onChange={(e) => updateSettings({ telemetry: e.target.checked })}
                  />
                  Diagnosedaten an den Entwickler senden
                </label>
              </SettingsField>
              <SettingsField label="Master-Key" htmlFor={keyId}>
                <input
                  id={keyId}
                  type="password"
                  autoComplete="new-password"
                  className={fieldControlClass}
                  value={settings.masterKey}
                  onChange={(e) => updateSettings({ masterKey: e.target.value })}
                  placeholder="Passwort zur Datensicherung"
                />
              </SettingsField>
            </div>
          ) : null}

          {tab === 'updates' ? (
            <div className="flex flex-col gap-6">
              <SettingsField label="Lizenzschlüssel" htmlFor={licenseId}>
                <input
                  id={licenseId}
                  type="text"
                  className={fieldControlClass}
                  value={settings.licenseKey}
                  onChange={(e) => updateSettings({ licenseKey: e.target.value })}
                  placeholder="Seriennummer oder Aktivierungscode"
                />
              </SettingsField>
              <SettingsField label="Version" htmlFor={versionId}>
                <input
                  id={versionId}
                  type="text"
                  readOnly
                  className={cn(fieldControlClass, 'bg-secondary text-muted-foreground')}
                  value={`Version ${APP_VERSION}`}
                />
              </SettingsField>
            </div>
          ) : null}
        </div>

        <div className="flex h-16 shrink-0 items-center justify-end border-t border-border px-8">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-[var(--radius-button)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity duration-200 ease-in-out hover:opacity-80"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  )
}
