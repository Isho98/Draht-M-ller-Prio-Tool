import { getDemoContext } from '@/lib/db/store'
import { testIntegrationConnection } from '@/lib/db/repositories/integrations'
import { AppError, apiSuccess, withErrorHandling } from '@/lib/api/server'

type RouteContext = { params: Promise<{ id: string }> }

export const POST = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { tenantId, userId } = getDemoContext()
  const { id } = await context.params
  const result = await testIntegrationConnection(tenantId, userId, id)
  if (!result.integration) {
    throw new AppError('NOT_FOUND', 'Anbindung nicht gefunden.', 404)
  }
  return apiSuccess({
    success: result.success,
    message: result.message,
    integration: result.integration,
  })
})
