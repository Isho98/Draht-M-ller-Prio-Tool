'use client'

import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  message: string
  className?: string
}

export function SuccessBanner({ message, className }: Props) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-[var(--radius-button)] border border-selected/30 bg-selected/10 px-4 py-3 text-sm',
        className,
      )}
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-selected" aria-hidden="true" />
      <p className="text-foreground">{message}</p>
    </div>
  )
}
