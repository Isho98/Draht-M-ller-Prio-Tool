'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { UploadZone } from '@/components/feinplanung/upload-zone'
import { ResultsTable } from '@/components/feinplanung/results-table'
import { TestDataForm } from '@/components/feinplanung/test-data-form'
import { FeinplanungSideNav, type FeinplanungView } from '@/components/feinplanung/side-nav'
import { PrioritizationSettings } from '@/components/feinplanung/prioritization-settings'
import { ErrorBanner } from '@/components/ui/error-banner'
import { SuccessBanner } from '@/components/ui/success-banner'
import {
  exportJob,
  getFeinplanungSettings,
  getUserFacingMessage,
  previewOrders,
  prioritizeJob,
  saveFeinplanungSettings,
  uploadPlanningFile,
  type UploadResponse,
} from '@/lib/api/feinplanung'
import { downloadBlob, saveAsBlob, writeFileToDirectory } from '@/lib/fs-export'
import { useAppState } from '@/components/app-state'
import { SHOW_TEST_PREVIEW } from '@/lib/modules/feinplanung/preview-flag'
import { DEFAULT_FEINPLANUNG_SETTINGS, type FeinplanungSettings } from '@/lib/modules/feinplanung/settings'
import { DASHBOARD_COLUMNS, DONE_COLUMNS } from '@/lib/modules/feinplanung/schema'
import type { PlanningOrder, PrioritizeResult } from '@/lib/modules/feinplanung/types'

export function FeinplanungScreen() {
  const { settings: appSettings } = useAppState()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [upload, setUpload] = useState<UploadResponse | null>(null)
  const [result, setResult] = useState<PrioritizeResult | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [view, setView] = useState<FeinplanungView>('dashboard')
  const [fpSettings, setFpSettings] = useState<FeinplanungSettings>(DEFAULT_FEINPLANUNG_SETTINGS)

  useEffect(() => {
    getFeinplanungSettings()
      .then(setFpSettings)
      .catch((err) => {
        setFpSettings(DEFAULT_FEINPLANUNG_SETTINGS)
        setError(getUserFacingMessage(err))
      })
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setBusy(true)
    setStatus('Datei wird gelesen…')
    setError(null)
    setNotice(null)
    setWarnings([])
    try {
      setStatus('Aufträge werden priorisiert…')
      const data = await uploadPlanningFile(file, { methodId: fpSettings.methodId })
      setUpload(data)
      setResult(data.result)
      setWarnings(data.result.warnings ?? [])
      setPreviewMode(false)
      setView('dashboard')
    } catch (err) {
      setError(getUserFacingMessage(err))
      setUpload(null)
      setResult(null)
    } finally {
      setBusy(false)
      setStatus(null)
    }
  }, [fpSettings.methodId])

  async function handlePreview(orders: PlanningOrder[]) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const data = await previewOrders(orders, { methodId: fpSettings.methodId })
      setUpload({
        jobId: data.jobId,
        fileName: data.fileName,
        sheetName: 'Vorschau',
        rowCount: data.result.rows.length + (data.result.completedRows?.length ?? 0),
        openCount: data.result.rows.length,
        completedCount: data.result.completedRows?.length ?? 0,
        columns: data.columns,
        doneColumns: data.doneColumns,
        result: data.result,
      })
      setResult(data.result)
      setWarnings(data.result.warnings ?? [])
      setPreviewMode(true)
      setView('dashboard')
    } catch (err) {
      setError(getUserFacingMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleSettingsChange(patch: Partial<FeinplanungSettings>) {
    setError(null)
    try {
      const next = await saveFeinplanungSettings(patch)
      setFpSettings(next)
      if (upload) {
        const refreshed = await prioritizeJob(upload.jobId, { methodId: next.methodId })
        setResult(refreshed)
        setWarnings(refreshed.warnings ?? [])
      }
    } catch (err) {
      setError(getUserFacingMessage(err))
    }
  }

  async function handleExport(mode: 'default' | 'save-as') {
    if (!upload) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const { blob, filename } = await exportJob(upload.jobId)
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
    setPreviewMode(false)
    setView('dashboard')
  }

  const dashboardColumns = upload?.columns ?? [...DASHBOARD_COLUMNS]
  const doneColumns = upload?.doneColumns ?? [...DONE_COLUMNS]
  const doneRows = result?.completedRows ?? []

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col px-8 pb-16 pt-8">
      <div className="mb-8 grid h-10 grid-cols-[1fr_auto_1fr] items-center">
        <Link
          href="/"
          className="inline-flex h-10 w-fit items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground"
        >
          <ChevronLeft className="size-4" strokeWidth={1.5} />
          Bereiche
        </Link>
        <h1 className="text-base font-medium tracking-tight">Feinplanung</h1>
        <div className="flex h-10 items-center justify-end">
          {upload ? (
            <button
              type="button"
              onClick={reset}
              className="h-10 rounded-[var(--radius-button)] px-4 text-sm text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-secondary hover:text-foreground"
            >
              Neue Datei
            </button>
          ) : (
            <span className="h-10" />
          )}
        </div>
      </div>

      <div className="flex items-start gap-8">
        <div className="min-w-0 flex-1">
          {error ? <ErrorBanner message={error} className="mb-8" /> : null}
          {notice ? <SuccessBanner message={notice} className="mb-8" /> : null}
          {warnings.map((warning) => (
            <p key={warning} className="mb-4 text-sm text-muted-foreground">
              {warning}
            </p>
          ))}

          {view === 'settings' ? (
            <PrioritizationSettings settings={fpSettings} busy={busy} onChange={handleSettingsChange} />
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
              <div className="flex flex-col gap-16">
                <UploadZone busy={busy} status={status} onFile={handleFile} />
                {SHOW_TEST_PREVIEW ? <TestDataForm busy={busy} onSubmit={handlePreview} /> : null}
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {upload.fileName}
                      {previewMode ? ' · Testmodus' : ''}
                    </p>
                    <p className="mt-1 text-[15px] font-medium">
                      {result?.rows.length ?? 0} offene Positionen, sortiert nach Puffer
                    </p>
                  </div>
                  <div className="flex gap-2">
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

                {result ? <ResultsTable columns={dashboardColumns} rows={result.rows} /> : null}
              </div>
            )
          ) : null}
        </div>

        <FeinplanungSideNav view={view} onChange={setView} doneCount={doneRows.length} />
      </div>
    </main>
  )
}
