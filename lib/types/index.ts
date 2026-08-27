export type FunctionArea = {
  id: string
  label: string
}

export type Area = {
  id: string
  label: string
  functions: FunctionArea[]
}

export type Company = {
  name: string
  claim: string
}

export type IntegrationStatus = 'active' | 'inactive' | 'error'

export type Integration = {
  id: string
  tenantId: string
  name: string
  type: string
  serverUrl: string
  status: IntegrationStatus
  lastTestedAt: string | null
  lastTestMessage: string | null
  mapping: Record<string, string>
  createdAt: string
  updatedAt: string
}

export type IntegrationInput = {
  name: string
  type: string
  serverUrl: string
  username?: string
  password?: string
  token?: string
  mapping?: Record<string, string>
}

export type HealthStatus = {
  status: 'ok' | 'degraded'
  timestamp: string
  database: 'ok' | 'error'
  integrations: Array<{
    id: string
    name: string
    status: IntegrationStatus
  }>
}

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    requestId: string
  }
}
