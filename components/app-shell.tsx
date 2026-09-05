'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Settings } from 'lucide-react'
import { SettingsModal } from '@/components/settings-modal'
import { IconButton } from '@/components/ui/icon-button'
import { AdeptIntro } from '@/components/intro/adept-intro'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [introFading, setIntroFading] = useState(false)

  function handleIntroComplete() {
    setIntroFading(true)
    window.setTimeout(() => setShowIntro(false), 400)
  }

  useEffect(() => {
    if (!settingsOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settingsOpen])

  useEffect(() => {
    if (!settingsOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [settingsOpen])

  if (showIntro) {
    return (
      <div className={cn('transition-opacity duration-[400ms] ease-in-out', introFading && 'opacity-0')}>
        <AdeptIntro onComplete={handleIntroComplete} />
      </div>
    )
  }

  return (
    <div className="min-h-svh animate-in overflow-x-hidden bg-background fade-in duration-500">
      <header className="fixed inset-x-0 top-0 z-30 h-16 bg-background">
        <div className="flex h-16 items-center justify-between px-4 sm:px-8">
          <IconButton label="Einstellungen" onClick={() => setSettingsOpen(true)}>
            <Settings className="size-5" strokeWidth={1.5} />
          </IconButton>
          <span className="size-10" aria-hidden="true" />
        </div>
      </header>
      <div className="min-h-svh pt-16">{children}</div>
      {settingsOpen ? <SettingsModal onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  )
}
