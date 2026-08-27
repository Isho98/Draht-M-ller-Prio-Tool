import { getDemoContext } from '@/lib/db/store'
import { listIntegrations } from '@/lib/db/repositories/integrations'
import { readStore } from '@/lib/db/store'
import { apiSuccess, withErrorHandling } from '@/lib/api/server'
import type { HealthStatus } from '@/lib/types'

export const GET = withErrorHandling(async () => {
  const { tenantId } = getDemoContext()

  let database: HealthStatus['database'] = 'ok'
  let integrations: HealthStatus['integrations'] = []

  try {
    await readStore()
    const list = await listIntegrations(tenantId)
    integrations = list.map((i) => ({
      id: i.id,
      name: i.name,
      status: i.status,
    }))
  } catch {
    database = 'error'
  }

  const degraded = database === 'error' || integrations.some((i) => i.status === 'error')

  const health: HealthStatus = {
    status: degraded ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    database,
    integrations,
  }

  return apiSuccess(health)
})
