'use client'

import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorBanner({ message, onRetry, className }: Props) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-[var(--radius-button)] border border-border bg-secondary/60 px-4 py-3 text-sm',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--color-error)]" aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-foreground">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="self-start rounded-[var(--radius-button)] border border-border bg-background px-3 py-1.5 text-xs transition-colors duration-200 ease-in-out hover:bg-secondary"
          >
            Erneut versuchen
          </button>
        ) : null}
      </div>
    </div>
  )
}
