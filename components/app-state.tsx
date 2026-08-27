'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { EMPTY_ACCOUNT, loadAccount, saveAccount, type AccountSession } from '@/lib/account'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type AppSettings } from '@/lib/settings'

type AppState = {
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
  account: AccountSession
  updateAccount: (patch: Partial<AccountSession>) => void
}

const AppStateContext = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [account, setAccount] = useState<AccountSession>(EMPTY_ACCOUNT)

  useEffect(() => {
    setSettings(loadSettings())
    setAccount(loadAccount())

    const onSettings = () => setSettings(loadSettings())
    const onAccount = () => setAccount(loadAccount())
    window.addEventListener('adept-settings-changed', onSettings)
    window.addEventListener('adept-account-changed', onAccount)
    return () => {
      window.removeEventListener('adept-settings-changed', onSettings)
      window.removeEventListener('adept-account-changed', onAccount)
    }
  }, [])

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const updateAccount = useCallback((patch: Partial<AccountSession>) => {
    setAccount((current) => {
      const next = { ...current, ...patch }
      saveAccount(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ settings, updateSettings, account, updateAccount }),
    [settings, updateSettings, account, updateAccount],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
