import { getDemoContext } from '@/lib/db/store'
import {
  createIntegration,
  listIntegrations,
} from '@/lib/db/repositories/integrations'
import { AppError, apiSuccess, withErrorHandling } from '@/lib/api/server'
import type { IntegrationInput } from '@/lib/types'

export const GET = withErrorHandling(async () => {
  const { tenantId } = getDemoContext()
  const integrations = await listIntegrations(tenantId)
  return apiSuccess({ integrations })
})

export const POST = withErrorHandling(async (request: Request) => {
  const { tenantId, userId } = getDemoContext()
  const body = (await request.json()) as IntegrationInput

  if (!body.name?.trim() || !body.type?.trim() || !body.serverUrl?.trim()) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Name, Typ und Server-Adresse sind erforderlich.',
      400,
    )
  }

  const integration = await createIntegration(tenantId, userId, body)
  return apiSuccess({ integration }, 201)
})
