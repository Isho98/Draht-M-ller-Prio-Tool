'use client'

import { PRIORITY_METHODS } from '@/lib/modules/feinplanung/methods/registry'
import { fieldControlClass } from '@/components/ui/settings-field'

type Props = {
  value: string
  onChange: (id: string) => void
}

export function MethodSelect({ value, onChange }: Props) {
  return (
    <label className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="text-sm text-muted-foreground">Priorisierung</span>
      <select
        className={`${fieldControlClass} w-full max-w-[360px]`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {PRIORITY_METHODS.map((method) => (
          <option key={method.id} value={method.id} disabled={!method.live}>
            {method.label}
            {method.live ? '' : ' (folgt)'}
          </option>
        ))}
      </select>
    </label>
  )
}
