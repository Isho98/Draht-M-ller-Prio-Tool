'use client'

import type { PrioritizedRow } from '@/lib/modules/feinplanung/types'
import { cn } from '@/lib/utils'

type Props = {
  columns: string[]
  rows: PrioritizedRow[]
}

export function ResultsTable({ columns, rows }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/80">
              <th className="sticky left-0 z-10 w-16 bg-secondary px-4 py-3 text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
                Prio
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  className="whitespace-nowrap px-4 py-3 text-[12px] font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {column}
                </th>
              ))}
              <th className="min-w-[240px] px-4 py-3 text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
                Begründung
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.sourceIndex}-${row.rank}`} className="h-11 border-b border-border last:border-b-0">
                <td
                  className={cn(
                    'sticky left-0 bg-background px-4 font-medium tabular-nums',
                    row.rank <= 3 ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {row.rank}
                </td>
                {columns.map((column) => (
                  <td key={column} className="whitespace-nowrap px-4 text-foreground">
                    {row.values[column] || '—'}
                  </td>
                ))}
                <td className="px-4 text-muted-foreground">{row.reasons.join(' · ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
