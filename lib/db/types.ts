import type { Area, Integration } from '@/lib/types'

export type DbUser = {
  id: string
  tenantId: string
  email: string
  name: string
  role: 'admin' | 'configurator' | 'viewer'
}

export type DbTenant = {
  id: string
  name: string
}

export type DbStore = {
  tenants: DbTenant[]
  users: DbUser[]
  areas: Area[]
  selections: Record<string, string[]>
  integrations: Integration[]
  integrationSecrets: Record<string, { username?: string; password?: string; token?: string }>
  auditLogs: Array<{
    id: string
    tenantId: string
    userId: string
    action: string
    payload: unknown
    timestamp: string
  }>
}
