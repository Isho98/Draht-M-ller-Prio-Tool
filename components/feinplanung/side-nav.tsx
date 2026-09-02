'use client'

import { cn } from '@/lib/utils'

export type FeinplanungView = 'dashboard' | 'settings' | 'done'

const ITEMS: { id: FeinplanungView; label: string }[] = [
  { id: 'dashboard', label: 'Priorisierungsdashboard' },
  { id: 'settings', label: 'Priorisierungseinstellungen' },
  { id: 'done', label: 'Erledigt' },
]

type Props = {
  view: FeinplanungView
  onChange: (view: FeinplanungView) => void
  doneCount?: number
}

export function FeinplanungSideNav({ view, onChange, doneCount }: Props) {
  return (
    <nav aria-label="Feinplanung" className="w-[240px] shrink-0">
      <ul className="flex flex-col gap-1">
        {ITEMS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                'flex h-10 w-full items-center rounded-[var(--radius-button)] px-4 text-left text-sm transition-colors duration-200 ease-in-out',
                view === item.id
                  ? 'bg-secondary font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="truncate">{item.label}</span>
              {item.id === 'done' && doneCount ? (
                <span className="ml-auto pl-2 text-[11px] tabular-nums text-muted-foreground">{doneCount}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
