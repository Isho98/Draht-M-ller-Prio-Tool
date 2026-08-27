'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Settings, User } from 'lucide-react'
import { AccountModal } from '@/components/account-modal'
import { SettingsModal } from '@/components/settings-modal'
import { IconButton } from '@/components/ui/icon-button'
import { useAppState } from '@/components/app-state'

export function AppShell({ children }: { children: ReactNode }) {
  const { account } = useAppState()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    if (!settingsOpen && !accountOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false)
        setAccountOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settingsOpen, accountOpen])

  useEffect(() => {
    if (!settingsOpen && !accountOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [settingsOpen, accountOpen])

  return (
    <div className="min-h-svh bg-background">
      <header className="fixed inset-x-0 top-0 z-30 h-16 bg-background">
        <div className="flex h-16 items-center justify-between px-8">
          <IconButton label="Einstellungen" onClick={() => setSettingsOpen(true)}>
            <Settings className="size-5" strokeWidth={1.5} />
          </IconButton>
          <IconButton label={account.signedIn ? 'Konto' : 'Anmelden'} onClick={() => setAccountOpen(true)}>
            <User className="size-5" strokeWidth={1.5} />
          </IconButton>
        </div>
      </header>
      <div className="min-h-svh pt-16">{children}</div>
      {settingsOpen ? <SettingsModal onClose={() => setSettingsOpen(false)} /> : null}
      {accountOpen ? <AccountModal onClose={() => setAccountOpen(false)} /> : null}
    </div>
  )
}
