'use client'

import { cn } from '@/lib/utils'

type Props = {
  label?: string
  className?: string
}

export function LoadingState({ label = 'Wird geladen…', className }: Props) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-4 py-24', className)}
      role="status"
      aria-live="polite"
    >
      <div className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
