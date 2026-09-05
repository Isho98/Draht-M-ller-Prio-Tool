'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { UploadZone } from '@/components/feinplanung/upload-zone'
import { ResultsTable } from '@/components/feinplanung/results-table'
import { FeinplanungSideNav, type FeinplanungView } from '@/components/feinplanung/side-nav'
import { PrioritizationSettings } from '@/components/feinplanung/prioritization-settings'
import { ErrorBanner } from '@/components/ui/error-banner'
import { SuccessBanner } from '@/components/ui/success-banner'
import {
  exportJob,
  getFeinplanungSettings,
  getUserFacingMessage,
  saveFeinplanungSettings,
  uploadPlanningFile,
  type UploadResponse,
} from '@/lib/api/feinplanung'
import { downloadBlob, saveAsBlob, writeFileToDirectory } from '@/lib/fs-export'
import { useAppState } from '@/components/app-state'
import {
  DEFAULT_FEINPLANUNG_SETTINGS,
  mergeFeinplanungSettings,
  type FeinplanungSettings,
} from '@/lib/modules/feinplanung/settings'
import {
  clearPlanningSession,
  readLocalFeinplanungSettings,
  readPlanningSession,
  writeLocalFeinplanungSettings,
  writePlanningSession,
} from '@/lib/modules/feinplanung/settings-storage'
import { prioritizeOrders } from '@/lib/modules/feinplanung/service'
import { DASHBOARD_COLUMNS, DONE_COLUMNS } from '@/lib/modules/feinplanung/schema'
import type { PrioritizeResult } from '@/lib/modules/feinplanung/types'

export function FeinplanungScreen() {
  const { settings: appSettings } = useAppState()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [upload, setUpload] = useState<UploadResponse | null>(null)
  const [result, setResult] = useState<PrioritizeResult | null>(null)
  const [view, setView] = useState<FeinplanungView>('dashboard')
  const [fpSettings, setFpSettings] = useState<FeinplanungSettings>(DEFAULT_FEINPLANUNG_SETTINGS)

  const uploadRef = useRef(upload)
  const settingsRef = useRef(fpSettings)
  uploadRef.current = upload
  settingsRef.current = fpSettings

  const applyRanking = useCallback((nextSettings: FeinplanungSettings = settingsRef.current) => {
    const current = uploadRef.current
    if (!current?.orders?.length) return false
    const { result: nextResult } = prioritizeOrders(current.orders, nextSettings, nextSettings.methodId)
    setResult(nextResult)
    setWarnings(nextResult.warnings ?? [])
    return true
  }, [])

  useEffect(() => {
    const local = readLocalFeinplanungSettings()
    const settings = local ?? DEFAULT_FEINPLANUNG_SETTINGS
    if (local) setFpSettings(local)

    const session = readPlanningSession()
    if (session?.orders?.length) {
      const restored = {
        ...session,
        result: prioritizeOrders(session.orders, settings, settings.methodId).result,
      } as UploadResponse
      setUpload(restored)
      setResult(restored.result)
      setWarnings(restored.result.warnings ?? [])
    }

    getFeinplanungSettings()
      .then((server) => {
        if (local) return
        setFpSettings(server)
        writeLocalFeinplanungSettings(server)
        applyRanking(server)
      })
      .catch(() => {
        if (!local) setFpSettings(DEFAULT_FEINPLANUNG_SETTINGS)
      })
  }, [applyRanking])

  const applySettings = useCallback(
    (next: FeinplanungSettings) => {
      setFpSettings(next)
      writeLocalFeinplanungSettings(next)
      applyRanking(next)
    },
    [applyRanking],
  )

  const handleFile = useCallback(
    async (file: File) => {
      setBusy(true)
      setStatus('Datei wird gelesen…')
      setError(null)
      setNotice(null)
      setWarnings([])
      try {
        setStatus('Aufträge werden priorisiert…')
        const data = await uploadPlanningFile(file, { methodId: fpSettings.methodId, settings: fpSettings })
        setUpload(data)
        uploadRef.current = data
        writePlanningSession(data)
        const { result: ranked } = prioritizeOrders(data.orders, fpSettings, fpSettings.methodId)
        setResult(ranked)
        setWarnings(ranked.warnings ?? [])
        setView('dashboard')
      } catch (err) {
        setError(getUserFacingMessage(err))
        setUpload(null)
        setResult(null)
        clearPlanningSession()
      } finally {
        setBusy(false)
        setStatus(null)
      }
    },
    [fpSettings],
  )

  function handleSettingsChange(patch: Partial<FeinplanungSettings>) {
    const next = mergeFeinplanungSettings(fpSettings, patch)
    applySettings(next)
    setError(null)
    void saveFeinplanungSettings(next).catch(() => {
      // Browser settings remain the source of truth on Vercel.
    })
  }

  function handleRefresh() {
    setError(null)
    const ok = applyRanking(settingsRef.current)
    if (!ok) {
      setError('Bitte zuerst eine Excel-Datei laden.')
      return
    }
    setNotice('Priorisierung aktualisiert.')
  }

  async function handleExport(mode: 'default' | 'save-as') {
    if (!upload || !result) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const { blob, filename } = await exportJob(upload.jobId, {
        fileName: upload.fileName,
        rows: result.rows,
      })
      if (mode === 'save-as') {
        const ok = await saveAsBlob(blob, filename)
        if (ok) setNotice('Datei gespeichert.')
        return
      }
      if (appSettings.saveLocationName) {
        const written = await writeFileToDirectory(filename, blob)
        if (written) {
          setNotice(`Gespeichert in „${appSettings.saveLocationName}“.`)
          return
        }
      }
      downloadBlob(blob, filename)
      setNotice('Export heruntergeladen.')
    } catch (err) {
      setError(getUserFacingMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setUpload(null)
    setResult(null)
    setError(null)
    setNotice(null)
    setWarnings([])
    setView('dashboard')
    clearPlanningSession()
  }

  const dashboardColumns = upload?.columns ?? [...DASHBOARD_COLUMNS]
  const doneColumns = upload?.doneColumns ?? [...DONE_COLUMNS]
  const doneRows = result?.completedRows ?? []

  return (
    <main className="mx-auto flex w-full max-w-[1280px] min-w-0 flex-col px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-6 flex h-10 items-center justify-between gap-4 sm:mb-8">
        <h1 className="min-w-0 truncate text-base font-medium tracking-tight">Produktionspriorisierung</h1>
        <div className="flex h-10 shrink-0 items-center justify-end">
          {upload ? (
            <button
              type="button"
              onClick={reset}
              className="h-10 rounded-[var(--radius-button)] px-3 text-sm text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-secondary hover:text-foreground sm:px-4"
            >
              Neue Datei
            </button>
          ) : (
            <span className="h-10" />
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col items-stretch gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1 order-2 lg:order-1">
          {error ? <ErrorBanner message={error} className="mb-8" /> : null}
          {notice ? <SuccessBanner message={notice} className="mb-8" /> : null}
          {warnings.map((warning) => (
            <p key={warning} className="mb-4 text-sm text-muted-foreground">
              {warning}
            </p>
          ))}

          {view === 'settings' ? (
            <PrioritizationSettings settings={fpSettings} busy={false} onChange={handleSettingsChange} />
          ) : null}

          {view === 'done' ? (
            upload && doneRows.length > 0 ? (
              <div>
                <p className="mb-6 text-sm text-muted-foreground">
                  {doneRows.length} bereits abgeschlossene Positionen (Status F) — nicht in der Priorisierung.
                </p>
                <ResultsTable columns={doneColumns} rows={doneRows} hidePriority />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {upload
                  ? 'Keine erledigten Positionen in dieser Datei.'
                  : 'Bitte zuerst eine Excel-Datei laden. Positionen mit Status F1–F3 erscheinen hier.'}
              </p>
            )
          ) : null}

          {view === 'dashboard' ? (
            !upload ? (
              <UploadZone busy={busy} status={status} onFile={handleFile} />
            ) : (
              <div className="flex min-w-0 flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-muted-foreground">{upload.fileName}</p>
                    <p className="mt-1 text-[15px] font-medium">
                      {result?.rows.length ?? 0} offene Positionen, sortiert nach Puffer
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || !result}
                      onClick={() => handleExport('default')}
                      className="h-10 rounded-[var(--radius-button)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity duration-200 ease-in-out hover:opacity-80 disabled:opacity-40"
                    >
                      Exportieren
                    </button>
                    <button
                      type="button"
                      disabled={busy || !result}
                      onClick={() => handleExport('save-as')}
                      className="h-10 rounded-[var(--radius-button)] border border-border px-5 text-sm transition-colors duration-200 ease-in-out hover:bg-secondary disabled:opacity-40"
                    >
                      Speichern unter...
                    </button>
                  </div>
                </div>

                {result ? (
                  <ResultsTable
                    columns={dashboardColumns}
                    rows={result.rows}
                    toolbar={
                      <button
                        type="button"
                        disabled={!upload.orders?.length}
                        onClick={handleRefresh}
                        className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-button)] border border-border px-4 text-sm transition-colors duration-200 ease-in-out hover:bg-secondary disabled:opacity-40"
                      >
                        <RefreshCw className="size-4" strokeWidth={1.5} />
                        Aktualisieren
                      </button>
                    }
                  />
                ) : null}
              </div>
            )
          ) : null}
        </div>

        <div className="order-1 lg:order-2">
          <FeinplanungSideNav view={view} onChange={setView} doneCount={doneRows.length} />
        </div>
      </div>
    </main>
  )
}
