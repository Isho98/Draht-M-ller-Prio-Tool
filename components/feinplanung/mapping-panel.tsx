'use client'

import { FIELD_LABELS } from '@/lib/modules/feinplanung/fields'
import { CANONICAL_FIELDS, type CanonicalField, type ColumnMapping } from '@/lib/modules/feinplanung/types'
import { fieldControlClass } from '@/components/ui/settings-field'
import { SettingsField } from '@/components/ui/settings-field'

type Props = {
  columns: string[]
  mapping: ColumnMapping
  onChange: (mapping: ColumnMapping) => void
  onApply: () => void
  busy: boolean
  needsReview: boolean
}

export function MappingPanel({ columns, mapping, onChange, onApply, busy, needsReview }: Props) {
  function update(field: CanonicalField, value: string) {
    onChange({ ...mapping, [field]: value || null })
  }

  return (
    <section className="rounded-2xl border border-border px-8 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-medium tracking-tight">Spaltenzuordnung</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {needsReview
              ? 'Einige Spalten wurden nicht erkannt. Bitte zuordnen, damit die Priorisierung greift.'
              : 'Zuordnung geprüft. Anpassungen sind jederzeit möglich.'}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onApply}
          className="h-10 shrink-0 rounded-[var(--radius-button)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity duration-200 ease-in-out hover:opacity-80 disabled:opacity-40"
        >
          Neu priorisieren
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {CANONICAL_FIELDS.map((field) => (
          <SettingsField key={field} label={FIELD_LABELS[field]} htmlFor={`map-${field}`}>
            <select
              id={`map-${field}`}
              className={fieldControlClass}
              value={mapping[field] ?? ''}
              onChange={(e) => update(field, e.target.value)}
            >
              <option value="">— nicht zugeordnet —</option>
              {columns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </SettingsField>
        ))}
      </div>
    </section>
  )
}
