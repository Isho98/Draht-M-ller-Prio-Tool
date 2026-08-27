import { getDemoContext } from '@/lib/db/store'
import {
  getIntegration,
  setIntegrationActive,
  testIntegrationConnection,
  updateIntegrationMapping,
} from '@/lib/db/repositories/integrations'
import { AppError, apiSuccess, withErrorHandling } from '@/lib/api/server'

type RouteContext = { params: Promise<{ id: string }> }

export const GET = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { tenantId } = getDemoContext()
  const { id } = await context.params
  const integration = await getIntegration(tenantId, id)
  if (!integration) {
    throw new AppError('NOT_FOUND', 'Anbindung nicht gefunden.', 404)
  }
  return apiSuccess({ integration })
})

export const PATCH = withErrorHandling(async (request: Request, context: RouteContext) => {
  const { tenantId, userId } = getDemoContext()
  const { id } = await context.params
  const body = (await request.json()) as {
    active?: boolean
    mapping?: Record<string, string>
  }

  if (typeof body.active === 'boolean') {
    const integration = await setIntegrationActive(tenantId, userId, id, body.active)
    if (!integration) throw new AppError('NOT_FOUND', 'Anbindung nicht gefunden.', 404)
    return apiSuccess({ integration })
  }

  if (body.mapping && typeof body.mapping === 'object') {
    const integration = await updateIntegrationMapping(tenantId, userId, id, body.mapping)
    if (!integration) throw new AppError('NOT_FOUND', 'Anbindung nicht gefunden.', 404)
    return apiSuccess({ integration })
  }

  throw new AppError('VALIDATION_ERROR', 'Keine gültigen Felder zum Aktualisieren.', 400)
})
