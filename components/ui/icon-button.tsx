import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
}

export function IconButton({ label, className, children, type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'flex size-10 items-center justify-center rounded-[var(--radius-button)] text-foreground',
        'transition-colors duration-200 ease-in-out',
        'hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
