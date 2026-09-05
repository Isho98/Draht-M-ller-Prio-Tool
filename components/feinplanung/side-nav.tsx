'use client'

import { cn } from '@/lib/utils'

export type FeinplanungView = 'dashboard' | 'settings' | 'done'

const ITEMS: { id: FeinplanungView; label: string; shortLabel: string }[] = [
  { id: 'dashboard', label: 'Priorisierungsdashboard', shortLabel: 'Dashboard' },
  { id: 'settings', label: 'Priorisierungseinstellungen', shortLabel: 'Einstellungen' },
  { id: 'done', label: 'Erledigt', shortLabel: 'Erledigt' },
]

type Props = {
  view: FeinplanungView
  onChange: (view: FeinplanungView) => void
  doneCount?: number
}

export function FeinplanungSideNav({ view, onChange, doneCount }: Props) {
  return (
    <nav aria-label="Produktionspriorisierung" className="w-full shrink-0 lg:w-[240px]">
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {ITEMS.map((item) => (
          <li key={item.id} className="shrink-0 lg:w-full">
            <button
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                'flex h-10 w-full items-center rounded-[var(--radius-button)] px-4 text-left text-sm whitespace-nowrap transition-colors duration-200 ease-in-out',
                view === item.id
                  ? 'bg-secondary font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="truncate lg:hidden">{item.shortLabel}</span>
              <span className="hidden truncate lg:inline">{item.label}</span>
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
