'use client'

import { useId, useState } from 'react'
import { X } from 'lucide-react'
import { useAppState } from '@/components/app-state'
import { IconButton } from '@/components/ui/icon-button'
import { SettingsField, fieldControlClass } from '@/components/ui/settings-field'

type Props = {
  onClose: () => void
}

export function AccountModal({ onClose }: Props) {
  const { account, updateAccount } = useAppState()
  const [email, setEmail] = useState(account.email)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const emailId = useId()
  const passwordId = useId()

  function handleSignIn(event: React.FormEvent) {
    event.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.')
      return
    }
    if (password.length < 4) {
      setError('Bitte ein Passwort mit mindestens 4 Zeichen eingeben.')
      return
    }
    updateAccount({ email: email.trim(), signedIn: true })
    setPassword('')
    setError(null)
    onClose()
  }

  function handleSignOut() {
    updateAccount({ signedIn: false, email: '' })
    setEmail('')
    setPassword('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-8">
      <button type="button" className="absolute inset-0 bg-black/30" aria-label="Schließen" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-2xl border border-border bg-background shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
      >
        <div className="flex h-16 items-center justify-between px-8">
          <h2 id="account-title" className="text-lg font-medium tracking-tight">
            {account.signedIn ? 'Konto' : 'Anmelden'}
          </h2>
          <IconButton label="Schließen" onClick={onClose}>
            <X className="size-5" strokeWidth={1.5} />
          </IconButton>
        </div>

        {account.signedIn ? (
          <div className="flex flex-col gap-6 px-8 pb-8">
            <p className="text-sm text-muted-foreground">Angemeldet als</p>
            <p className="text-[15px] font-medium">{account.email}</p>
            <p className="text-sm text-muted-foreground">
              Dies ist eine lokale Testanmeldung. Es wird kein Konto auf einem Server angelegt.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="h-10 rounded-[var(--radius-button)] border border-border text-sm transition-colors duration-200 ease-in-out hover:bg-secondary"
            >
              Abmelden
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="flex flex-col gap-6 px-8 pb-8">
            <SettingsField label="E-Mail" htmlFor={emailId}>
              <input
                id={emailId}
                type="email"
                autoComplete="username"
                className={fieldControlClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@firma.de"
              />
            </SettingsField>
            <SettingsField label="Passwort" htmlFor={passwordId}>
              <input
                id={passwordId}
                type="password"
                autoComplete="current-password"
                className={fieldControlClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </SettingsField>
            {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
            <button
              type="submit"
              className="h-10 rounded-[var(--radius-button)] bg-primary text-sm font-medium text-primary-foreground transition-opacity duration-200 ease-in-out hover:opacity-80"
            >
              Anmelden
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
