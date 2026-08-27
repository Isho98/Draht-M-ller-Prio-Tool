import { COMPANY } from '@/lib/seed-data'
import { cn } from '@/lib/utils'

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-semibold tracking-tight text-foreground select-none',
        className,
      )}
    >
      {COMPANY.name}
    </span>
  )
}
