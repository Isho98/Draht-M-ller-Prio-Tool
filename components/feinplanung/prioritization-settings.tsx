'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { MethodSelect } from '@/components/feinplanung/method-select'
import { fieldControlClass } from '@/components/ui/settings-field'
import {
  WEEKDAYS,
  type CustomerPriority,
  type FeinplanungSettings,
  type WeekdayId,
} from '@/lib/modules/feinplanung/settings'

type Props = {
  settings: FeinplanungSettings
  busy: boolean
  onChange: (patch: Partial<FeinplanungSettings>) => void
}

function formatHoursInput(value: number): string {
  return String(value).replace('.', ',')
}

function parseHoursInput(value: string): number | null {
  const parsed = Number(value.trim().replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

export function PrioritizationSettings({ settings, busy, onChange }: Props) {
  const [ignoreDraft, setIgnoreDraft] = useState('')
  const [hideDraft, setHideDraft] = useState('')
  const [customerDraft, setCustomerDraft] = useState('')
  const [percentDraft, setPercentDraft] = useState('60')
  const [hoursDraft, setHoursDraft] = useState<Record<WeekdayId, string>>(() => {
    const next = {} as Record<WeekdayId, string>
    for (const day of WEEKDAYS) next[day.id] = formatHoursInput(settings.weekdayCapacity[day.id])
    return next
  })

  useEffect(() => {
    setHoursDraft((current) => {
      const next = { ...current }
      for (const day of WEEKDAYS) {
        next[day.id] = formatHoursInput(settings.weekdayCapacity[day.id])
      }
      return next
    })
  }, [settings.weekdayCapacity])

  function addIgnore() {
    const value = ignoreDraft.trim()
    if (!value) return
    onChange({ ignoreMachines: [...settings.ignoreMachines, value] })
    setIgnoreDraft('')
  }

  function addHiddenCustomer() {
    const value = hideDraft.trim()
    if (!value) return
    onChange({ ignoreCustomers: [...settings.ignoreCustomers, value] })
    setHideDraft('')
  }

  function addCustomer() {
    const name = customerDraft.trim()
    if (!name) return
    const percent = Number(percentDraft.replace(',', '.'))
    const next: CustomerPriority = {
      id: crypto.randomUUID(),
      name,
      percent: Number.isFinite(percent) ? percent : 50,
    }
    const existing = settings.customerPriorities.filter(
      (entry) => entry.name.trim().toLowerCase() !== name.toLowerCase(),
    )
    onChange({ customerPriorities: [...existing, next] })
    setCustomerDraft('')
    setPercentDraft('60')
  }

  function commitWeekday(id: WeekdayId) {
    const hours = parseHoursInput(hoursDraft[id])
    if (hours === null) {
      setHoursDraft((current) => ({ ...current, [id]: formatHoursInput(settings.weekdayCapacity[id]) }))
      return
    }
    if (hours === settings.weekdayCapacity[id]) {
      setHoursDraft((current) => ({ ...current, [id]: formatHoursInput(hours) }))
      return
    }
    onChange({
      weekdayCapacity: {
        ...settings.weekdayCapacity,
        [id]: hours,
      },
    })
  }

  return (
    <div className="flex flex-col gap-12">
      <section>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Methode</p>
        <h2 className="mt-1 text-base font-medium tracking-tight">Priorisierungsmethode</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">Wirkt sich auf die nächste Berechnung aus.</p>
        <MethodSelect value={settings.methodId} onChange={(methodId) => onChange({ methodId })} />
      </section>

      <section>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Maschinen</p>
        <h2 className="mt-1 text-base font-medium tracking-tight">Ignorierliste</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Namen oder Präfixe (ab 3 Buchstaben), die nicht in den Restaufwand einfließen. Standard: Paletten und
          Fremdleist.
        </p>
        <PrefixList
          entries={settings.ignoreMachines}
          busy={busy}
          draft={ignoreDraft}
          placeholder="z. B. Paletten"
          onDraft={setIgnoreDraft}
          onAdd={addIgnore}
          onRemove={(entry) =>
            onChange({ ignoreMachines: settings.ignoreMachines.filter((item) => item !== entry) })
          }
        />
      </section>

      <section>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Kunden</p>
        <h2 className="mt-1 text-base font-medium tracking-tight">Kundenpriorität</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Standard 50 %. Höherer Wert = wichtiger. Die ersten drei Buchstaben reichen, z. B. „VDL“ für „VDL Janssen“.
        </p>
        <div className="grid grid-cols-[minmax(0,1fr)_96px_40px] gap-x-3 border-b border-border pb-2 text-[11px] tracking-wide text-muted-foreground uppercase sm:gap-x-4">
          <span>Kundenname</span>
          <span>Priorität</span>
          <span />
        </div>
        {settings.customerPriorities.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">Noch keine abweichenden Kundenprioritäten.</p>
        ) : (
          settings.customerPriorities.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[minmax(0,1fr)_96px_40px] items-center gap-x-3 border-b border-border sm:gap-x-4"
            >
              <span className="h-10 truncate text-sm leading-10">{entry.name}</span>
              <input
                className={fieldControlClass}
                type="number"
                min={0}
                max={100}
                step={1}
                value={entry.percent}
                disabled={busy}
                onChange={(e) => {
                  const percent = Number(e.target.value)
                  onChange({
                    customerPriorities: settings.customerPriorities.map((item) =>
                      item.id === entry.id ? { ...item, percent } : item,
                    ),
                  })
                }}
                aria-label={`Priorität für ${entry.name}`}
              />
              <button
                type="button"
                disabled={busy}
                aria-label={`${entry.name} entfernen`}
                onClick={() =>
                  onChange({
                    customerPriorities: settings.customerPriorities.filter((item) => item.id !== entry.id),
                  })
                }
                className="flex size-10 items-center justify-center text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ))
        )}
        <div className="mt-4 grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_96px_auto] sm:gap-x-4">
          <input
            className={fieldControlClass}
            value={customerDraft}
            onChange={(e) => setCustomerDraft(e.target.value)}
            placeholder="Kunde oder Präfix, z. B. VDL"
          />
          <input
            className={fieldControlClass}
            type="number"
            min={0}
            max={100}
            step={1}
            value={percentDraft}
            onChange={(e) => setPercentDraft(e.target.value)}
            aria-label="Priorität in Prozent"
          />
          <button
            type="button"
            disabled={busy || !customerDraft.trim()}
            onClick={addCustomer}
            className="inline-flex h-10 items-center gap-2 px-4 text-sm text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground disabled:opacity-40"
          >
            <Plus className="size-4" strokeWidth={1.5} />
            Hinzufügen
          </button>
        </div>
      </section>

      <section>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Kunden</p>
        <h2 className="mt-1 text-base font-medium tracking-tight">Kunden komplett ausblenden</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Ausgeblendete Kunden erscheinen nicht in der Ergebnistabelle. Präfix-Matching wie oben, z. B. „VDL“.
        </p>
        <PrefixList
          entries={settings.ignoreCustomers ?? []}
          busy={busy}
          draft={hideDraft}
          placeholder="z. B. VDL"
          emptyText="Noch keine ausgeblendeten Kunden."
          onDraft={setHideDraft}
          onAdd={addHiddenCustomer}
          onRemove={(entry) =>
            onChange({ ignoreCustomers: settings.ignoreCustomers.filter((item) => item !== entry) })
          }
        />
      </section>

      <section>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Kapazität</p>
        <h2 className="mt-1 text-base font-medium tracking-tight">Tagesliste</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Produktionsstunden pro Wochentag. Fließen direkt in die Rückwärtsrechnung ein.
        </p>
        <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-x-4 border-b border-border pb-2 text-[11px] tracking-wide text-muted-foreground uppercase">
          <span>Wochentag</span>
          <span>Stunden</span>
        </div>
        {WEEKDAYS.map((day) => (
          <div
            key={day.id}
            className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-x-4 border-b border-border last:border-b-0"
          >
            <span className="h-10 text-sm leading-10">{day.label}</span>
            <input
              className={fieldControlClass}
              inputMode="decimal"
              value={hoursDraft[day.id]}
              disabled={busy}
              onChange={(e) => setHoursDraft((current) => ({ ...current, [day.id]: e.target.value }))}
              onBlur={() => commitWeekday(day.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
              aria-label={`Stunden am ${day.label}`}
            />
          </div>
        ))}
      </section>
    </div>
  )
}

function PrefixList({
  entries,
  busy,
  draft,
  placeholder,
  emptyText,
  onDraft,
  onAdd,
  onRemove,
}: {
  entries: string[]
  busy: boolean
  draft: string
  placeholder: string
  emptyText?: string
  onDraft: (value: string) => void
  onAdd: () => void
  onRemove: (entry: string) => void
}) {
  return (
    <>
      {entries.length === 0 && emptyText ? (
        <p className="py-6 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-col">
          {entries.map((entry) => (
            <li
              key={entry}
              className="flex h-10 items-center justify-between border-b border-border last:border-b-0"
            >
              <span className="truncate text-sm">{entry}</span>
              <button
                type="button"
                disabled={busy}
                aria-label={`${entry} entfernen`}
                onClick={() => onRemove(entry)}
                className="flex size-10 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          className={fieldControlClass}
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onAdd()
          }}
          placeholder={placeholder}
        />
        <button
          type="button"
          disabled={busy || !draft.trim()}
          onClick={onAdd}
          className="inline-flex h-10 items-center gap-2 px-4 text-sm text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground disabled:opacity-40"
        >
          <Plus className="size-4" strokeWidth={1.5} />
          Hinzufügen
        </button>
      </div>
    </>
  )
}
