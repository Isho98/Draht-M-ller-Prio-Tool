'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowDownAZ, ArrowDownNarrowWide, ArrowUpNarrowWide, ChevronDown } from 'lucide-react'
import type { PrioritizedRow } from '@/lib/modules/feinplanung/types'
import { cn } from '@/lib/utils'

type SortMode = 'prio-asc' | 'prio-desc' | 'customer-asc'

type Column = {
  id: string
  label: string
  filter?: boolean
}

const PRODUCTION_COLUMNS: Column[] = [
  { id: 'Auftrag', label: 'Auftrag' },
  { id: 'Abrufnummer', label: 'Abrufnummer' },
  { id: 'Arbeitskartennummer', label: 'Arbeitskartennummer' },
  { id: 'Kunde', label: 'Kunde' },
  { id: 'Artikel', label: 'Artikel' },
  { id: 'Menge', label: 'Menge' },
  { id: 'Prio', label: 'Prio', filter: true },
  { id: 'Maschine', label: 'Maschine' },
]

const DONE_VIEW_COLUMNS: Column[] = [
  { id: 'Auftrag', label: 'Auftrag' },
  { id: 'Kunde', label: 'Kunde' },
  { id: 'Artikel', label: 'Artikel' },
  { id: 'Menge', label: 'Menge' },
  { id: 'F', label: 'F' },
]

type Props = {
  columns?: string[]
  rows: PrioritizedRow[]
  hidePriority?: boolean
}

function cellValue(row: PrioritizedRow, column: string): string {
  if (column === 'Prio') return String(row.rank)
  return row.values[column]?.trim() || '—'
}

export function ResultsTable({ rows, hidePriority }: Props) {
  const columns = hidePriority ? DONE_VIEW_COLUMNS : PRODUCTION_COLUMNS
  const [openColumn, setOpenColumn] = useState<string | null>(null)
  const [prioFilter, setPrioFilter] = useState<string[]>([])
  const [sort, setSort] = useState<SortMode>('prio-asc')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPrioFilter([])
    setOpenColumn(null)
  }, [rows])

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpenColumn(null)
    }
    window.addEventListener('click', onPointer)
    return () => window.removeEventListener('click', onPointer)
  }, [])

  const prioValues = useMemo(
    () => [...new Set(rows.map((row) => String(row.rank)))].sort((a, b) => Number(a) - Number(b)),
    [rows],
  )

  const visible = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (prioFilter.length === 0) return true
      return prioFilter.includes(String(row.rank))
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'customer-asc') {
        return (a.values.Kunde || a.canonical.customer).localeCompare(
          b.values.Kunde || b.canonical.customer,
          'de',
          { sensitivity: 'base' },
        )
      }
      if (sort === 'prio-desc') return b.rank - a.rank
      return a.rank - b.rank
    })
  }, [rows, prioFilter, sort])

  function togglePrio(value: string) {
    setPrioFilter((current) => {
      const selected = new Set(current.length ? current : prioValues)
      if (selected.has(value)) selected.delete(value)
      else selected.add(value)
      const next = [...selected]
      if (next.length === prioValues.length) return []
      return next
    })
  }

  return (
    <div ref={rootRef} className="w-full min-w-0">
      {hidePriority ? null : (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Sortieren</span>
          <SortButton
            active={sort === 'customer-asc'}
            onClick={() => setSort('customer-asc')}
            icon={<ArrowDownAZ className="size-3.5" strokeWidth={1.5} />}
            label="Kundenname"
          />
          <SortButton
            active={sort === 'prio-asc'}
            onClick={() => setSort('prio-asc')}
            icon={<ArrowDownNarrowWide className="size-3.5" strokeWidth={1.5} />}
            label="Prio aufsteigend"
          />
          <SortButton
            active={sort === 'prio-desc'}
            onClick={() => setSort('prio-desc')}
            icon={<ArrowUpNarrowWide className="size-3.5" strokeWidth={1.5} />}
            label="Prio absteigend"
          />
        </div>
      )}

      <div className="hidden md:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => {
                const active = column.filter && prioFilter.length > 0
                return (
                  <th
                    key={column.id}
                    className={cn(
                      'relative px-2 py-3 font-medium first:pl-0 last:pr-0 sm:px-3',
                      column.id === 'Prio' && 'w-[84px]',
                      column.id === 'Menge' && 'w-[72px]',
                      column.id === 'Auftrag' && 'w-[12%]',
                      column.id === 'Maschine' && 'w-[26%]',
                    )}
                  >
                    {column.filter ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setOpenColumn((current) => (current === column.id ? null : column.id))
                        }}
                        className={cn(
                          'inline-flex max-w-full items-center gap-1 text-left text-[11px] leading-tight tracking-wide uppercase transition-colors duration-200 ease-in-out',
                          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {column.label}
                        <ChevronDown className={cn('size-3', openColumn === column.id && 'rotate-180')} strokeWidth={1.5} />
                      </button>
                    ) : (
                      <span className="block text-[11px] leading-tight tracking-wide text-muted-foreground uppercase">
                        {column.label}
                      </span>
                    )}
                    {column.filter && openColumn === column.id ? (
                      <div
                        className="absolute top-full left-0 z-20 mt-1 max-h-64 min-w-[180px] overflow-auto rounded-[var(--radius-button)] border border-border bg-background py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="flex h-8 w-full items-center px-3 text-left text-xs text-muted-foreground hover:bg-secondary"
                          onClick={() => {
                            setPrioFilter([])
                            setOpenColumn(null)
                          }}
                        >
                          Alle Prioritäten
                        </button>
                        {prioValues.map((value) => {
                          const selected = prioFilter.length === 0 || prioFilter.includes(value)
                          return (
                            <label
                              key={value}
                              className="flex h-8 cursor-pointer items-center gap-2 px-3 text-xs hover:bg-secondary"
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => togglePrio(value)}
                              />
                              <span>Prio {value}</span>
                            </label>
                          )
                        })}
                      </div>
                    ) : null}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={`${row.sourceIndex}-${row.rank}`} className="border-b border-border last:border-b-0">
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      'px-3 py-3 align-top first:pl-0 last:pr-0',
                      column.id === 'Prio' && 'font-medium tabular-nums',
                      column.id === 'Maschine' ? 'break-words text-foreground' : 'break-words text-foreground',
                    )}
                  >
                    {cellValue(row, column.id)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {visible.map((row) => (
          <li
            key={`${row.sourceIndex}-${row.rank}`}
            className="rounded-2xl border border-border px-4 py-4"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="text-[15px] font-medium tracking-tight">{cellValue(row, hidePriority ? 'Auftrag' : 'Auftrag')}</p>
              {hidePriority ? null : (
                <p className="text-sm font-medium tabular-nums">Prio {row.rank}</p>
              )}
            </div>
            <dl className="grid grid-cols-[minmax(0,112px)_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
              {columns
                .filter((column) => column.id !== 'Auftrag' && column.id !== 'Prio')
                .map((column) => (
                  <div key={column.id} className="contents">
                    <dt className="text-muted-foreground">{column.label}</dt>
                    <dd className="min-w-0 break-words">{cellValue(row, column.id)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>

      {visible.length === 0 ? (
        <p className="px-1 py-8 text-sm text-muted-foreground">Keine Zeilen für die gewählten Filter.</p>
      ) : null}
    </div>
  )
}

function SortButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] px-3 text-sm transition-colors duration-200 ease-in-out',
        active ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
