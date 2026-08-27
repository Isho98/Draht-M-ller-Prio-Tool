export type AccountSession = {
  email: string
  signedIn: boolean
}

const STORAGE_KEY = 'adept-account-session'

export const EMPTY_ACCOUNT: AccountSession = { email: '', signedIn: false }

export function loadAccount(): AccountSession {
  if (typeof window === 'undefined') return EMPTY_ACCOUNT
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_ACCOUNT
    return { ...EMPTY_ACCOUNT, ...(JSON.parse(raw) as Partial<AccountSession>) }
  } catch {
    return EMPTY_ACCOUNT
  }
}

export function saveAccount(account: AccountSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
  window.dispatchEvent(new Event('adept-account-changed'))
}
