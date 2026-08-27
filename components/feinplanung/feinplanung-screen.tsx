'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { UploadZone } from '@/components/feinplanung/upload-zone'
import { MappingPanel } from '@/components/feinplanung/mapping-panel'
import { ResultsTable } from '@/components/feinplanung/results-table'
import { ErrorBanner } from '@/components/ui/error-banner'
import { SuccessBanner } from '@/components/ui/success-banner'
import {
  exportJob,
  getUserFacingMessage,
  prioritizeJob,
  uploadPlanningFile,
  type UploadResponse,
} from '@/lib/api/feinplanung'
import { downloadBlob, saveAsBlob, writeFileToDirectory } from '@/lib/fs-export'
import { useAppState } from '@/components/app-state'
import type { ColumnMapping, PrioritizeResult } from '@/lib/modules/feinplanung/types'

export function FeinplanungScreen() {
  const { settings } = useAppState()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [upload, setUpload] = useState<UploadResponse | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [result, setResult] = useState<PrioritizeResult | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setBusy(true)
    setStatus('Datei wird gelesen…')
    setError(null)
    setNotice(null)
    try {
      setStatus('Aufträge werden priorisiert…')
      const data = await uploadPlanningFile(file)
      setUpload(data)
      setMapping(data.mapping)
      setResult(data.result)
    } catch (err) {
      setError(getUserFacingMessage(err))
      setUpload(null)
      setResult(null)
    } finally {
      setBusy(false)
      setStatus(null)
    }
  }, [])

  async function handleRePrioritize() {
    if (!upload) return
    setBusy(true)
    setStatus('Aufträge werden priorisiert…')
    setError(null)
    try {
      const next = await prioritizeJob(upload.jobId, mapping)
      setResult(next)
      setNotice('Priorisierung aktualisiert.')
    } catch (err) {
      setError(getUserFacingMessage(err))
    } finally {
      setBusy(false)
      setStatus(null)
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
      if (settings.saveLocationName) {
        const written = await writeFileToDirectory(filename, blob)
        if (written) {
          setNotice(`Gespeichert in „${settings.saveLocationName}“.`)
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
    setMapping({})
    setError(null)
    setNotice(null)
  }

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col px-8 pb-16 pt-8">
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

      {error ? <ErrorBanner message={error} className="mb-8" /> : null}
      {notice ? <SuccessBanner message={notice} className="mb-8" /> : null}

      {!upload ? (
        <div className="flex flex-1 flex-col justify-center pt-16">
          <UploadZone busy={busy} status={status} onFile={handleFile} />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{upload.fileName}</p>
              <p className="mt-1 text-[15px] font-medium">
                {result?.rows.length ?? upload.rowCount} Aufträge, sortiert nach Priorität
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

          {result ? <ResultsTable columns={upload.columns} rows={result.rows} /> : null}

          <MappingPanel
            columns={upload.columns}
            mapping={mapping}
            onChange={setMapping}
            onApply={handleRePrioritize}
            busy={busy}
            needsReview={upload.needsReview}
          />
        </div>
      )}
    </main>
  )
}
