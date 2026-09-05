'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { machineNamesFromDisplay } from '@/lib/modules/feinplanung/machines'
import type { PrioritizedRow } from '@/lib/modules/feinplanung/types'
import { cn } from '@/lib/utils'

type SortMode = 'prio-asc' | 'prio-desc' | 'customer-asc' | 'order-asc'

type SearchKey = 'Auftrag' | 'Abrufnummer'

type ColumnId =
  | 'Auftrag'
  | 'Abrufnummer'
  | 'Kunde'
  | 'Artikel'
  | 'Menge'
  | 'Prio'
  | 'Maschine'
  | 'F'

type Column = {
  id: ColumnId
  label: string
  filter?: 'prio' | 'machines' | 'search'
}

const PRODUCTION_COLUMNS: Column[] = [
  { id: 'Auftrag', label: 'Auftrag', filter: 'search' },
  { id: 'Abrufnummer', label: 'Abrufnummer', filter: 'search' },
  { id: 'Kunde', label: 'Kunde' },
  { id: 'Artikel', label: 'Artikel' },
  { id: 'Menge', label: 'Menge' },
  { id: 'Prio', label: 'Prio', filter: 'prio' },
  { id: 'Maschine', label: 'Maschine', filter: 'machines' },
]

const DONE_VIEW_COLUMNS: Column[] = [
  { id: 'Auftrag', label: 'Auftrag' },
  { id: 'Kunde', label: 'Kunde' },
  { id: 'Artikel', label: 'Artikel' },
  { id: 'Menge', label: 'Menge' },
  { id: 'F', label: 'F' },
]

const GRID_COLS =
  'minmax(5.75rem,0.95fr) minmax(6.5rem,1fr) minmax(6.75rem,1.2fr) minmax(6.25rem,1.2fr) minmax(4rem,0.55fr) minmax(4.25rem,0.5fr) minmax(8.5rem,1.5fr)'

const SORT_OPTIONS: { id: SortMode; menu: string; button: string }[] = [
  { id: 'prio-asc', menu: 'Priorisierung aufsteigend', button: 'Priorisierung ↑' },
  { id: 'prio-desc', menu: 'Priorisierung absteigend', button: 'Priorisierung ↓' },
  { id: 'customer-asc', menu: 'Kundenname (A–Z)', button: 'Kundenname' },
  { id: 'order-asc', menu: 'Auftragsnummer', button: 'Auftrag' },
]

type Props = {
  columns?: string[]
  rows: PrioritizedRow[]
  hidePriority?: boolean
  toolbar?: ReactNode
}

function cellValue(row: PrioritizedRow, column: string): string {
  if (column === 'Prio') return String(row.rank)
  return row.values[column]?.trim() || '—'
}

function compareAuftrag(a: PrioritizedRow, b: PrioritizedRow): number {
  return String(a.values.Auftrag || '').localeCompare(String(b.values.Auftrag || ''), 'de', {
    numeric: true,
    sensitivity: 'base',
  })
}

export function ResultsTable({ rows, hidePriority, toolbar }: Props) {
  const columns = hidePriority ? DONE_VIEW_COLUMNS : PRODUCTION_COLUMNS
  const [openColumn, setOpenColumn] = useState<string | null>(null)
  const [sortOpen, setSortOpen] = useState(false)
  const [prioFilter, setPrioFilter] = useState<string[]>([])
  const [machineFilter, setMachineFilter] = useState<string[]>([])
  const [search, setSearch] = useState({ Auftrag: '', Abrufnummer: '' })
  const [sort, setSort] = useState<SortMode>('prio-asc')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenColumn(null)
        setSortOpen(false)
      }
    }
    window.addEventListener('click', onPointer)
    return () => window.removeEventListener('click', onPointer)
  }, [])

  const prioValues = useMemo(
    () => [...new Set(rows.map((row) => String(row.rank)))].sort((a, b) => Number(a) - Number(b)),
    [rows],
  )

  const machineValues = useMemo(() => {
    const names = new Set<string>()
    for (const row of rows) {
      for (const name of machineNamesFromDisplay(row.values.Maschine || '')) names.add(name)
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }))
  }, [rows])

  const visible = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (prioFilter.length > 0 && !prioFilter.includes(String(row.rank))) return false
      if (machineFilter.length > 0) {
        const names = machineNamesFromDisplay(row.values.Maschine || '')
        if (!machineFilter.some((wanted) => names.includes(wanted))) return false
      }
      const auftrag = search.Auftrag.trim().toLowerCase()
      if (auftrag && !cellValue(row, 'Auftrag').toLowerCase().includes(auftrag)) return false
      const abruf = search.Abrufnummer.trim().toLowerCase()
      if (abruf && !cellValue(row, 'Abrufnummer').toLowerCase().includes(abruf)) return false
      return true
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'customer-asc') {
        return (a.values.Kunde || a.canonical.customer).localeCompare(b.values.Kunde || b.canonical.customer, 'de', {
          sensitivity: 'base',
        })
      }
      if (sort === 'order-asc') return compareAuftrag(a, b)
      if (sort === 'prio-desc') return b.rank - a.rank
      return a.rank - b.rank
    })
  }, [rows, prioFilter, machineFilter, search, sort])

  const activeSort = SORT_OPTIONS.find((option) => option.id === sort) ?? SORT_OPTIONS[0]

  function filterActive(column: Column): boolean {
    if (column.filter === 'prio') return prioFilter.length > 0
    if (column.filter === 'machines') return machineFilter.length > 0
    if (column.filter === 'search') return Boolean(search[column.id as SearchKey]?.trim())
    return false
  }

  function filterCount(column: Column): number {
    if (column.filter === 'prio') return prioFilter.length
    if (column.filter === 'machines') return machineFilter.length
    if (column.filter === 'search') return search[column.id as SearchKey]?.trim() ? 1 : 0
    return 0
  }

  function togglePrio(value: string) {
    setPrioFilter((current) => {
      const selected = new Set(current.length ? current : prioValues)
      if (selected.has(value)) selected.delete(value)
      else selected.add(value)
      const next = [...selected]
      if (next.length === 0 || next.length === prioValues.length) return []
      return next
    })
  }

  function toggleMachine(value: string) {
    setMachineFilter((current) => {
      const selected = new Set(current)
      if (selected.has(value)) selected.delete(value)
      else selected.add(value)
      return [...selected]
    })
  }

  return (
    <div ref={rootRef} className="w-full min-w-0">
      {hidePriority ? null : (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setSortOpen((open) => !open)
                setOpenColumn(null)
              }}
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-button)] border border-border px-4 text-sm transition-colors duration-200 ease-in-out hover:bg-secondary"
            >
              <span className="text-muted-foreground">Sortieren:</span>
              <span>{activeSort.button}</span>
              <ChevronDown className={cn('size-3.5 text-muted-foreground', sortOpen && 'rotate-180')} strokeWidth={1.5} />
            </button>
            {sortOpen ? (
              <div
                className="absolute top-full left-0 z-30 mt-1 min-w-[240px] overflow-hidden rounded-[var(--radius-button)] border border-border bg-background py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                onClick={(event) => event.stopPropagation()}
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSort(option.id)
                      setSortOpen(false)
                    }}
                    className={cn(
                      'flex h-10 w-full items-center px-4 text-left text-sm transition-colors duration-200 ease-in-out hover:bg-secondary',
                      sort === option.id ? 'font-medium text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {option.menu}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {toolbar}
        </div>
      )}

      <div className="hidden md:block">
        <div
          className="grid items-end gap-x-3 border-b border-border"
          style={{ gridTemplateColumns: hidePriority ? 'repeat(5, minmax(0, 1fr))' : GRID_COLS }}
        >
          {columns.map((column) => {
            const active = filterActive(column)
            const count = filterCount(column)
            return (
              <div key={column.id} className="relative min-w-0 py-3">
                {column.filter ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setOpenColumn((current) => (current === column.id ? null : column.id))
                      setSortOpen(false)
                    }}
                    className={cn(
                      'inline-flex max-w-full items-start gap-1 text-left text-[11px] leading-snug uppercase transition-colors duration-200 ease-in-out',
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span className="min-w-0 break-words">{column.label}</span>
                    <ChevronDown
                      className={cn('mt-0.5 size-3 shrink-0', openColumn === column.id && 'rotate-180')}
                      strokeWidth={1.5}
                    />
                    {active ? (
                      <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-medium tabular-nums">
                        {count}
                      </span>
                    ) : null}
                  </button>
                ) : (
                  <span className="block min-w-0 break-words text-[11px] leading-snug text-muted-foreground uppercase">
                    {column.label}
                  </span>
                )}
                {column.filter && openColumn === column.id ? (
                  <FilterMenu
                    column={column}
                    prioValues={prioValues}
                    prioFilter={prioFilter}
                    machineValues={machineValues}
                    machineFilter={machineFilter}
                    search={search}
                    onResetPrio={() => setPrioFilter([])}
                    onTogglePrio={togglePrio}
                    onResetMachines={() => setMachineFilter([])}
                    onToggleMachine={toggleMachine}
                    onSearch={(id, value) => setSearch((current) => ({ ...current, [id]: value }))}
                    onClose={() => setOpenColumn(null)}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
        {visible.map((row) => (
          <div
            key={`${row.sourceIndex}-${row.rank}`}
            className="grid items-start gap-x-3 border-b border-border last:border-b-0"
            style={{ gridTemplateColumns: hidePriority ? 'repeat(5, minmax(0, 1fr))' : GRID_COLS }}
          >
            {columns.map((column) => (
              <div
                key={column.id}
                className={cn(
                  'min-w-0 py-3 text-sm break-words',
                  column.id === 'Prio' && 'font-medium tabular-nums',
                )}
              >
                {cellValue(row, column.id)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {visible.map((row) => (
          <li key={`${row.sourceIndex}-${row.rank}`} className="rounded-2xl border border-border px-4 py-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="text-[15px] font-medium tracking-tight">{cellValue(row, 'Auftrag')}</p>
              {hidePriority ? null : <p className="text-sm font-medium tabular-nums">Prio {row.rank}</p>}
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

function FilterMenu({
  column,
  prioValues,
  prioFilter,
  machineValues,
  machineFilter,
  search,
  onResetPrio,
  onTogglePrio,
  onResetMachines,
  onToggleMachine,
  onSearch,
  onClose,
}: {
  column: Column
  prioValues: string[]
  prioFilter: string[]
  machineValues: string[]
  machineFilter: string[]
  search: { Auftrag: string; Abrufnummer: string }
  onResetPrio: () => void
  onTogglePrio: (value: string) => void
  onResetMachines: () => void
  onToggleMachine: (value: string) => void
  onSearch: (id: SearchKey, value: string) => void
  onClose: () => void
}) {
  const alignEnd = column.id === 'Maschine' || column.id === 'Prio'
  return (
    <div
      className={cn(
        'absolute top-full z-30 mt-1 max-h-64 min-w-[200px] overflow-auto rounded-[var(--radius-button)] border border-border bg-background py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
        alignEnd ? 'right-0' : 'left-0',
      )}
      onClick={(event) => event.stopPropagation()}
    >
      {column.filter === 'prio' ? (
        <>
          <button
            type="button"
            className="flex h-8 w-full items-center px-3 text-left text-xs text-muted-foreground hover:bg-secondary"
            onClick={() => {
              onResetPrio()
              onClose()
            }}
          >
            Alle Prioritäten
          </button>
          {prioValues.map((value) => {
            const selected = prioFilter.length === 0 || prioFilter.includes(value)
            return (
              <label key={value} className="flex h-8 cursor-pointer items-center gap-2 px-3 text-xs hover:bg-secondary">
                <input type="checkbox" checked={selected} onChange={() => onTogglePrio(value)} />
                <span>Prio {value}</span>
              </label>
            )
          })}
        </>
      ) : null}

      {column.filter === 'machines' ? (
        <>
          <button
            type="button"
            className="flex h-8 w-full items-center px-3 text-left text-xs text-muted-foreground hover:bg-secondary"
            onClick={() => {
              onResetMachines()
              onClose()
            }}
          >
            Alle Maschinen
          </button>
          {machineValues.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Keine Maschinen in der Liste.</p>
          ) : (
            machineValues.map((value) => (
              <label key={value} className="flex h-8 cursor-pointer items-center gap-2 px-3 text-xs hover:bg-secondary">
                <input type="checkbox" checked={machineFilter.includes(value)} onChange={() => onToggleMachine(value)} />
                <span className="truncate">{value}</span>
              </label>
            ))
          )}
        </>
      ) : null}

      {column.filter === 'search' ? (
        <div className="flex flex-col gap-2 px-3">
          <input
            className="h-9 w-full rounded-[var(--radius-button)] border border-border bg-background px-3 text-sm outline-none"
            value={search[column.id as SearchKey]}
            onChange={(event) => onSearch(column.id as SearchKey, event.target.value)}
            placeholder={`${column.label} suchen`}
            autoFocus
          />
          <button
            type="button"
            className="h-8 text-left text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onSearch(column.id as SearchKey, '')}
          >
            Filter zurücksetzen
          </button>
        </div>
      ) : null}
    </div>
  )
}
