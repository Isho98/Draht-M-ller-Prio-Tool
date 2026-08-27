import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type Props = {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
}

export function SettingsField({ label, htmlFor, children, className }: Props) {
  return (
    <div className={cn('settings-field', className)}>
      <label htmlFor={htmlFor} className="text-sm leading-5 text-foreground">
        {label}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export const fieldControlClass =
  'h-10 w-full rounded-[var(--radius-button)] border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors duration-200 ease-in-out placeholder:text-muted-foreground hover:border-foreground/20 focus:border-foreground/40'
