'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { MethodSelect } from '@/components/feinplanung/method-select'
import { fieldControlClass } from '@/components/ui/settings-field'
import type { CustomerPriority, FeinplanungSettings } from '@/lib/modules/feinplanung/settings'

type Props = {
  settings: FeinplanungSettings
  busy: boolean
  onChange: (patch: Partial<FeinplanungSettings>) => void
}

export function PrioritizationSettings({ settings, busy, onChange }: Props) {
  const [ignoreDraft, setIgnoreDraft] = useState('')
  const [customerDraft, setCustomerDraft] = useState('')
  const [percentDraft, setPercentDraft] = useState('60')

  function addIgnore() {
    const value = ignoreDraft.trim()
    if (!value) return
    onChange({ ignoreMachines: [...settings.ignoreMachines, value] })
    setIgnoreDraft('')
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

  return (
    <div className="flex flex-col gap-12">
      <section>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Methode</p>
        <h2 className="mt-1 text-base font-medium tracking-tight">Priorisierungsmethode</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Wirkt sich auf die nächste Berechnung aus.
        </p>
        <MethodSelect value={settings.methodId} onChange={(methodId) => onChange({ methodId })} />
      </section>

      <section>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Maschinen</p>
        <h2 className="mt-1 text-base font-medium tracking-tight">Ignorierliste</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Namen oder Präfixe, die nicht in den Restaufwand einfließen. Standard: Paletten und Fremdleist.
        </p>
        <ul className="flex flex-col">
          {settings.ignoreMachines.map((entry) => (
            <li
              key={entry}
              className="flex h-10 items-center justify-between border-b border-border last:border-b-0"
            >
              <span className="text-sm">{entry}</span>
              <button
                type="button"
                disabled={busy}
                aria-label={`${entry} entfernen`}
                onClick={() =>
                  onChange({
                    ignoreMachines: settings.ignoreMachines.filter((item) => item !== entry),
                  })
                }
                className="flex size-10 items-center justify-center text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <input
            className={fieldControlClass}
            value={ignoreDraft}
            onChange={(e) => setIgnoreDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addIgnore()
            }}
            placeholder="z. B. Paletten"
          />
          <button
            type="button"
            disabled={busy || !ignoreDraft.trim()}
            onClick={addIgnore}
            className="inline-flex h-10 items-center gap-2 px-4 text-sm text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground disabled:opacity-40"
          >
            <Plus className="size-4" strokeWidth={1.5} />
            Hinzufügen
          </button>
        </div>
      </section>

      <section>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Kunden</p>
        <h2 className="mt-1 text-base font-medium tracking-tight">Kundenpriorität</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Standard 50 %. Höherer Wert = wichtiger. Unbekannte Kunden bleiben bei 50 %.
        </p>
        <div className="grid grid-cols-[minmax(0,1fr)_96px_40px] gap-x-4 border-b border-border pb-2 text-[11px] tracking-wide text-muted-foreground uppercase">
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
              className="grid grid-cols-[minmax(0,1fr)_96px_40px] items-center gap-x-4 border-b border-border"
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
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_96px_auto] items-center gap-x-4">
          <input
            className={fieldControlClass}
            value={customerDraft}
            onChange={(e) => setCustomerDraft(e.target.value)}
            placeholder="Kundenname"
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
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Kapazität</p>
        <h2 className="mt-1 text-base font-medium tracking-tight">Tageskapazität</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mo–Do {String(settings.weekdayCapacity.mondayToThursday).replace('.', ',')} Std., Fr{' '}
          {String(settings.weekdayCapacity.friday).replace('.', ',')} Std. Wochenende ohne Kapazität.
        </p>
      </section>
    </div>
  )
}
