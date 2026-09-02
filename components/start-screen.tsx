'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useAppState } from '@/components/app-state'
import { APP_AREAS } from '@/lib/modules/areas'
import { cn } from '@/lib/utils'

export function StartScreen() {
  const { settings } = useAppState()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('click', onPointer)
    return () => window.removeEventListener('click', onPointer)
  }, [open])

  return (
    <main className="flex min-h-[calc(100svh-64px)] flex-col items-center justify-center px-8">
      <div className="flex w-[384px] flex-col items-center">
        <div className="flex size-[384px] items-center justify-center overflow-hidden">
          {settings.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoDataUrl} alt="Firmenlogo" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-base text-muted-foreground">Logo</span>
          )}
        </div>

        <p className="mt-2 text-[13px] tracking-wide text-muted-foreground">powered by adept&</p>

        <div ref={menuRef} className="relative mx-auto mt-8 w-[320px]">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-full items-center justify-between rounded-[var(--radius-button)] border border-border bg-background px-4 text-sm transition-colors duration-200 ease-in-out hover:bg-secondary"
          >
            <span>Bereiche</span>
            <ChevronDown
              className={cn('size-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
              strokeWidth={1.5}
            />
          </button>
          {open ? (
            <ul
              role="listbox"
              className="absolute inset-x-0 top-[calc(100%+8px)] z-10 overflow-hidden rounded-[var(--radius-button)] border border-border bg-background py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
            >
              {APP_AREAS.map((area) => (
                <li key={area.id} role="option" aria-selected={false}>
                  {area.available ? (
                    <Link
                      href={area.href}
                      className="flex h-11 w-full items-center px-4 text-left text-sm transition-colors duration-200 ease-in-out hover:bg-secondary"
                    >
                      {area.label}
                    </Link>
                  ) : (
                    <span className="flex h-11 w-full items-center px-4 text-sm text-muted-foreground">
                      {area.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </main>
  )
}
