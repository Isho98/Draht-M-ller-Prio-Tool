'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { fieldControlClass } from '@/components/ui/settings-field'
import { SettingsField } from '@/components/ui/settings-field'
import { parseMaschinenField } from '@/lib/modules/feinplanung/machines'
import type { PlanningOrder } from '@/lib/modules/feinplanung/types'

type Draft = {
  id: string
  auftNr: string
  customer: string
  dueDate: string
  maschinen: string
  offen: string
  statusF: string
}

type Props = {
  busy: boolean
  onSubmit: (orders: PlanningOrder[]) => void
}

function emptyDraft(): Draft {
  return {
    id: crypto.randomUUID(),
    auftNr: '',
    customer: '',
    dueDate: '',
    maschinen: '',
    offen: '',
    statusF: '',
  }
}

export function TestDataForm({ busy, onSubmit }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>([emptyDraft()])

  function update(id: string, patch: Partial<Draft>) {
    setDrafts((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function submit() {
    const orders: PlanningOrder[] = drafts.map((draft, index) => {
      const machines = parseMaschinenField(draft.maschinen, draft.id)
      return {
        id: draft.id,
        name: draft.auftNr || `Position ${index + 1}`,
        customer: draft.customer,
        article: '',
        dueDate: draft.dueDate,
        statusF: draft.statusF,
        completed: Boolean(draft.statusF.trim()),
        machines,
        extra: { offen: draft.offen, Maschinen: draft.maschinen },
        sourceIndex: index,
      }
    })
    onSubmit(orders)
  }

  return (
    <section className="rounded-2xl border border-border px-8 py-8">
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Testmodus</p>
        <h2 className="mt-1 text-base font-medium tracking-tight">Vorschau mit Testdaten</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dieselben Felder wie in der Excel-Liste. Maschinen im Format „MG930 6,50;Safan-3 2,50;“.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {drafts.map((draft, index) => (
          <div key={draft.id} className="flex flex-col gap-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Position {index + 1}</p>
              {drafts.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setDrafts((current) => current.filter((item) => item.id !== draft.id))}
                  className="inline-flex h-10 items-center gap-1 px-2 text-sm text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.5} />
                  Entfernen
                </button>
              ) : null}
            </div>
            <SettingsField label="AuftNr" htmlFor={`auft-${draft.id}`}>
              <input
                id={`auft-${draft.id}`}
                className={fieldControlClass}
                value={draft.auftNr}
                onChange={(e) => update(draft.id, { auftNr: e.target.value })}
                placeholder="110802"
              />
            </SettingsField>
            <SettingsField label="Name" htmlFor={`name-${draft.id}`}>
              <input
                id={`name-${draft.id}`}
                className={fieldControlClass}
                value={draft.customer}
                onChange={(e) => update(draft.id, { customer: e.target.value })}
                placeholder="Kundenname"
              />
            </SettingsField>
            <SettingsField label="Prod-Ende" htmlFor={`due-${draft.id}`}>
              <input
                id={`due-${draft.id}`}
                type="date"
                className={fieldControlClass}
                value={draft.dueDate}
                onChange={(e) => update(draft.id, { dueDate: e.target.value })}
              />
            </SettingsField>
            <SettingsField label="Maschinen" htmlFor={`maschinen-${draft.id}`}>
              <input
                id={`maschinen-${draft.id}`}
                className={fieldControlClass}
                value={draft.maschinen}
                onChange={(e) => update(draft.id, { maschinen: e.target.value })}
                placeholder="MG930 6,50;Safan-3 2,50;Paletten 0,50;"
              />
            </SettingsField>
            <SettingsField label="offen" htmlFor={`offen-${draft.id}`}>
              <input
                id={`offen-${draft.id}`}
                className={fieldControlClass}
                value={draft.offen}
                onChange={(e) => update(draft.id, { offen: e.target.value })}
                placeholder="20"
              />
            </SettingsField>
            <SettingsField label="F" htmlFor={`f-${draft.id}`}>
              <input
                id={`f-${draft.id}`}
                className={fieldControlClass}
                value={draft.statusF}
                onChange={(e) => update(draft.id, { statusF: e.target.value })}
                placeholder="leer = offen, F1/F2/F3 = erledigt"
              />
            </SettingsField>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDrafts((current) => [...current, emptyDraft()])}
            className="inline-flex h-10 items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground"
          >
            <Plus className="size-4" strokeWidth={1.5} />
            Position hinzufügen
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="h-10 rounded-[var(--radius-button)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity duration-200 ease-in-out hover:opacity-80 disabled:opacity-40"
          >
            Testdaten priorisieren
          </button>
        </div>
      </div>
    </section>
  )
}
