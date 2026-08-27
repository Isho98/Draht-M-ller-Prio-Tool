'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { ErrorBanner } from '@/components/ui/error-banner'
import { LoadingState } from '@/components/ui/loading-state'
import { useAreas, useSelection, useToggleSelection } from '@/hooks/use-config'
import { COMPANY } from '@/lib/seed-data'
import { getUserFacingMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Wordmark } from './wordmark'

type Props = {
  activeAreaId: string | null
  onSelectArea: (id: string) => void
}

export function ConfigScreen({ activeAreaId, onSelectArea }: Props) {
  const router = useRouter()
  const areasQuery = useAreas()
  const selectionQuery = useSelection()
  const toggleMutation = useToggleSelection()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isLoading = areasQuery.isLoading || selectionQuery.isLoading
  const error = areasQuery.error ?? selectionQuery.error
  const areas = areasQuery.data ?? []
  const selected = new Set(selectionQuery.data ?? [])
  const activeArea = areas.find((a) => a.id === activeAreaId) ?? null
  const canStart = selected.size > 0

  async function handleToggle(functionId: string) {
    setPendingId(functionId)
    try {
      await toggleMutation.toggle(functionId)
    } finally {
      setPendingId(null)
    }
  }

  if (isLoading) {
    return <LoadingState label="Bereiche werden geladen…" />
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
    <div className="flex min-h-svh flex-col md:flex-row">
      <button
        type="button"
        className="border-b border-border px-6 py-3 text-left text-sm font-medium md:hidden"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-expanded={sidebarOpen}
      >
        Bereiche {sidebarOpen ? '▲' : '▼'}
      </button>

      <aside
        className={cn(
          'shrink-0 border-b border-border bg-[var(--color-surface)] md:w-[var(--sidebar-width)] md:border-b-0 md:border-r',
          sidebarOpen ? 'block' : 'hidden md:block',
        )}
      >
        <nav
          aria-label="Bereiche"
          className="flex flex-col gap-1 p-[var(--space-3)] md:sticky md:top-0 md:p-[var(--space-4)]"
        >
          <p className="px-3 pb-[var(--space-2)] text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Bereiche
          </p>
          {areas.map((area) => {
            const isActive = area.id === activeAreaId
            const count = area.functions.filter((f) => selected.has(f.id)).length
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => {
                  onSelectArea(area.id)
                  setSidebarOpen(false)
                }}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] leading-relaxed font-medium transition-colors duration-200 ease-in-out',
                  isActive
                    ? 'bg-secondary font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                )}
              >
                <span className="text-pretty">{area.label}</span>
                {count > 0 && (
                  <span className="shrink-0 text-xs tabular-nums text-selected">{count}</span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-end gap-4 border-b border-border bg-background px-[var(--space-3)] py-[var(--space-3)] md:px-[var(--space-5)]">
          <button
            type="button"
            onClick={() => router.push('/settings')}
            className="mr-auto rounded-[var(--radius-button)] px-4 py-2 text-sm text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-secondary hover:text-foreground"
          >
            Einstellungen
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            disabled={!canStart || toggleMutation.isPending}
            className="rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-200 ease-in-out hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Start
          </button>
        </header>

        {error ? (
          <div className="px-[var(--space-3)] md:px-[var(--space-5)]">
            <ErrorBanner
              message={getUserFacingMessage(error)}
              onRetry={() => selectionQuery.refetch()}
            />
          </div>
        ) : null}

        <main className="flex flex-1 flex-col px-[var(--space-3)] pb-24 md:px-[var(--space-5)]">
          {activeArea === null ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-300">
              <Wordmark className="text-[32px] md:text-[40px] font-semibold tracking-tight" />
              <p className="text-[15px] text-muted-foreground md:text-base">{COMPANY.claim}</p>
            </div>
          ) : (
            <div
              key={activeArea.id}
              className="mx-auto w-full max-w-xl animate-in fade-in duration-300 md:pt-[var(--space-4)]"
            >
              <h1 className="mb-1 text-2xl font-medium tracking-tight text-balance md:text-3xl">
                {activeArea.label}
              </h1>
              <p className="mb-10 text-sm text-muted-foreground">Funktionsbereiche auswählen</p>

              <ul className="flex flex-col">
                {activeArea.functions.map((fn) => {
                  const isSelected = selected.has(fn.id)
                  const isPending = pendingId === fn.id
                  return (
                    <li key={fn.id} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() => handleToggle(fn.id)}
                        disabled={isPending}
                        aria-pressed={isSelected}
                        className="group flex w-full items-center justify-between gap-6 py-4 text-left transition-colors duration-200 ease-in-out disabled:opacity-60"
                      >
                        <span
                          className={cn(
                            'text-[15px] leading-relaxed text-pretty transition-colors duration-200 ease-in-out',
                            isSelected
                              ? 'font-medium text-selected'
                              : 'font-normal text-foreground group-hover:text-muted-foreground',
                          )}
                        >
                          {fn.label}
                        </span>
                        <span
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ease-in-out',
                            isSelected
                              ? 'border-selected text-selected'
                              : 'border-border text-muted-foreground group-hover:bg-secondary',
                          )}
                        >
                          {isSelected ? (
                            <Check className="size-4" strokeWidth={2} aria-hidden="true" />
                          ) : (
                            <Plus className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                          )}
                          <span className="sr-only">
                            {isSelected ? `${fn.label} abwählen` : `${fn.label} auswählen`}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
