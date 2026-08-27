'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ErrorBanner } from '@/components/ui/error-banner'
import { LoadingState } from '@/components/ui/loading-state'
import { ModuleView } from '@/components/module-views'
import { useAreas, useSelection } from '@/hooks/use-config'
import { getUserFacingMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Wordmark } from './wordmark'

export function DashboardScreen() {
  const router = useRouter()
  const areasQuery = useAreas()
  const selectionQuery = useSelection()
  const [activeId, setActiveId] = useState<string | null>(null)

  const isLoading = areasQuery.isLoading || selectionQuery.isLoading
  const error = areasQuery.error ?? selectionQuery.error
  const selectionCount = selectionQuery.data?.length ?? 0

  useEffect(() => {
    if (!isLoading && selectionCount === 0) {
      router.replace('/')
    }
  }, [isLoading, selectionCount, router])

  const areas = useMemo(() => {
    const selectedIds = new Set(selectionQuery.data ?? [])
    return (areasQuery.data ?? [])
      .map((area) => ({
        ...area,
        functions: area.functions.filter((f) => selectedIds.has(f.id)),
      }))
      .filter((area) => area.functions.length > 0)
  }, [areasQuery.data, selectionQuery.data])

  const resolvedActiveId = activeId ?? areas[0]?.id ?? ''
  const activeArea = areas.find((a) => a.id === resolvedActiveId) ?? areas[0] ?? null

  if (isLoading || selectionCount === 0) {
    return <LoadingState label="Dashboard wird geladen…" />
  }

  if (error && areas.length === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <ErrorBanner
          message={getUserFacingMessage(error)}
          onRetry={() => {
            areasQuery.refetch()
            selectionQuery.refetch()
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex flex-col items-center gap-8 border-b border-border px-[var(--space-3)] pt-10 pb-0 md:px-[var(--space-5)] md:pt-14">
        <div className="flex w-full flex-col items-center gap-3 sm:relative sm:flex-row sm:justify-center sm:gap-0">
          <Wordmark className="text-[32px] font-semibold tracking-tight md:text-[40px]" />
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-[var(--radius-button)] px-4 py-2 text-sm text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-secondary hover:text-foreground sm:absolute sm:right-0"
          >
            Konfiguration
          </button>
        </div>

        <nav aria-label="Hauptbereiche" className="flex max-w-full flex-wrap justify-center gap-1">
          {areas.map((area) => {
            const isActive = area.id === activeArea?.id
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setActiveId(area.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative -mb-px px-4 py-3 text-[14px] font-medium transition-colors duration-200 ease-in-out md:text-[15px]',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {area.label}
                <span
                  className={cn(
                    'absolute inset-x-3 bottom-0 h-px transition-opacity duration-200 ease-in-out',
                    isActive ? 'bg-foreground opacity-100' : 'opacity-0',
                  )}
                />
              </button>
            )
          })}
        </nav>
      </header>

      {error ? (
        <div className="px-[var(--space-3)] pt-4 md:px-[var(--space-5)]">
          <ErrorBanner message={getUserFacingMessage(error)} onRetry={() => selectionQuery.refetch()} />
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-[var(--content-max-width)] flex-1 px-[var(--space-3)] py-12 md:px-[var(--space-5)] md:py-16">
        {activeArea ? (
          <div key={activeArea.id} className="animate-in fade-in duration-300">
            <h1 className="mb-10 text-xl font-medium tracking-tight text-balance md:text-2xl">
              {activeArea.label}
            </h1>
            <ul className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeArea.functions.map((fn) => (
                <li key={fn.id} className="flex">
                  <Link
                    href={`/module/${fn.id}`}
                    className="group flex min-h-44 w-full flex-col justify-between gap-6 rounded-xl border border-border p-6 text-left transition-colors duration-200 ease-in-out hover:bg-secondary/60"
                  >
                    <span className="size-1.5 rounded-full bg-selected" aria-hidden="true" />
                    <span className="flex flex-col gap-2">
                      <span className="text-[17px] leading-snug text-pretty">{fn.label}</span>
                      <span className="text-xs text-muted-foreground transition-colors duration-200 ease-in-out group-hover:text-foreground">
                        Modul öffnen
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="py-24 text-center text-muted-foreground">
            Keine Funktionsbereiche ausgewählt.{' '}
            <Link href="/" className="underline underline-offset-4">
              Zur Konfiguration
            </Link>
          </p>
        )}
      </main>
    </div>
  )
}

type ModuleScreenProps = {
  moduleId: string
  moduleLabel: string
  areaLabel: string
}

export function ModuleScreen({ moduleId, moduleLabel, areaLabel }: ModuleScreenProps) {
  const router = useRouter()

  return (
    <div className="flex min-h-svh flex-col animate-in fade-in duration-300">
      <header className="border-b border-border px-[var(--space-3)] py-5 md:px-[var(--space-5)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-3">
            <Wordmark className="text-xl font-semibold" />
            <span className="text-xs text-muted-foreground">{areaLabel}</span>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="self-start rounded-[var(--radius-button)] px-4 py-2 text-sm text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-secondary hover:text-foreground sm:self-auto"
          >
            Zurück
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-[var(--space-3)] py-10 md:px-[var(--space-5)] md:py-12">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-xl font-medium tracking-tight text-balance md:text-2xl">
            {moduleLabel}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Beispielansicht – Darstellung ohne Funktion.
          </p>
        </div>
        <ModuleView moduleId={moduleId} />
      </main>
    </div>
  )
}
