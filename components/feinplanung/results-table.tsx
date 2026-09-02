'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { PrioritizedRow } from '@/lib/modules/feinplanung/types'
import { cn } from '@/lib/utils'

type Props = {
  columns: string[]
  rows: PrioritizedRow[]
  hidePriority?: boolean
}

export function ResultsTable({ columns, rows, hidePriority }: Props) {
  const extraColumns = columns.filter((column) => column !== 'Prio' && column !== 'Begründung')
  const allColumns = hidePriority ? [...extraColumns, 'Begründung'] : ['Prio', ...extraColumns, 'Begründung']
  const [openColumn, setOpenColumn] = useState<string | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpenColumn(null)
    }
    window.addEventListener('click', onPointer)
    return () => window.removeEventListener('click', onPointer)
  }, [])

  function cellValue(row: PrioritizedRow, column: string): string {
    if (column === 'Prio') return String(row.rank)
    if (column === 'Begründung') return row.reasons.join(' · ')
    return row.values[column] || '—'
  }

  const uniques = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const column of allColumns) {
      const values = [...new Set(rows.map((row) => cellValue(row, column)))].sort()
      map[column] = values
    }
    return map
  }, [rows, allColumns.join('|')])

  const visible = rows.filter((row) =>
    allColumns.every((column) => {
      const selected = filters[column]
      if (!selected || selected.length === 0) return true
      return selected.includes(cellValue(row, column))
    }),
  )

  function toggleValue(column: string, value: string) {
    setFilters((current) => {
      const selected = new Set(current[column] ?? uniques[column] ?? [])
      if (selected.has(value)) selected.delete(value)
      else selected.add(value)
      const all = uniques[column] ?? []
      const next = [...selected]
      if (next.length === all.length) {
        const { [column]: _, ...rest } = current
        return rest
      }
      return { ...current, [column]: next }
    })
  }

  return (
    <div ref={rootRef} className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {allColumns.map((column) => {
              const active = Boolean(filters[column]?.length)
              return (
                <th key={column} className="relative whitespace-nowrap px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setOpenColumn((current) => (current === column ? null : column))
                    }}
                    className={cn(
                      'inline-flex items-center gap-1 text-[12px] tracking-wide uppercase transition-colors duration-200 ease-in-out',
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {column}
                    <ChevronDown className={cn('size-3', openColumn === column && 'rotate-180')} strokeWidth={1.5} />
                  </button>
                  {openColumn === column ? (
                    <div
                      className="absolute top-full left-0 z-20 mt-1 max-h-64 min-w-[200px] overflow-auto rounded-[var(--radius-button)] border border-border bg-background py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="flex h-8 w-full items-center px-3 text-left text-xs text-muted-foreground hover:bg-secondary"
                        onClick={() => {
                          setFilters((current) => {
                            const { [column]: _, ...rest } = current
                            return rest
                          })
                          setOpenColumn(null)
                        }}
                      >
                        Filter zurücksetzen
                      </button>
                      {(uniques[column] ?? []).map((value) => {
                        const selected = !filters[column] || filters[column].includes(value)
                        return (
                          <label
                            key={value}
                            className="flex h-8 cursor-pointer items-center gap-2 px-3 text-xs hover:bg-secondary"
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleValue(column, value)}
                            />
                            <span className="truncate">{value}</span>
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
            <tr key={`${row.sourceIndex}-${row.rank}`} className="h-11 border-b border-border last:border-b-0">
              {hidePriority ? null : <td className="px-4 font-medium tabular-nums">{row.rank}</td>}
              {extraColumns.map((column) => (
                <td key={column} className="whitespace-nowrap px-4 text-foreground">
                  {row.values[column] || '—'}
                </td>
              ))}
              <td className="px-4 text-muted-foreground">{row.reasons.join(' · ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {visible.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted-foreground">Keine Zeilen für die gewählten Filter.</p>
      ) : null}
    </div>
  )
}
