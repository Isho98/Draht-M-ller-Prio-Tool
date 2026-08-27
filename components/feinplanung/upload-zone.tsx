'use client'

import { useCallback, useRef, useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  busy: boolean
  status: string | null
  onFile: (file: File) => void
}

function isExcel(file: File) {
  return /\.(xlsx|xls)$/i.test(file.name)
}

export function UploadZone({ busy, status, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (!file) return
      if (!isExcel(file)) {
        setLocalError('Bitte eine Excel-Datei (.xlsx oder .xls) wählen.')
        return
      }
      setLocalError(null)
      onFile(file)
    },
    [onFile],
  )

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div
        onDragEnter={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center rounded-2xl border border-dashed px-8 py-16 text-center transition-colors duration-200 ease-in-out',
          over ? 'border-foreground bg-secondary/70' : 'border-border bg-secondary/40',
        )}
      >
        <FileSpreadsheet className="size-8 text-muted-foreground" strokeWidth={1.5} />
        <p className="mt-6 text-[15px] font-medium tracking-tight">Excel-Datei hierher ziehen</p>
        <p className="mt-2 text-sm text-muted-foreground">.xlsx oder .xls</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-8 h-10 rounded-[var(--radius-button)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity duration-200 ease-in-out hover:opacity-80 disabled:opacity-40"
        >
          Excel-Datei hochladen
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      <div className="mt-6 min-h-6 text-center text-sm text-muted-foreground">
        {busy ? status ?? 'Wird verarbeitet…' : localError}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            const response = await fetch('/api/v1/feinplanung/sample')
            const blob = await response.blob()
            onFile(
              new File([blob], 'feinplanung-beispiel.xlsx', {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              }),
            )
          }}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Beispieldatei laden
        </button>
        <span className="mx-2">·</span>
        <a href="/api/v1/feinplanung/sample" className="underline-offset-4 hover:text-foreground hover:underline">
          Herunterladen
        </a>
      </p>
    </div>
  )
}
