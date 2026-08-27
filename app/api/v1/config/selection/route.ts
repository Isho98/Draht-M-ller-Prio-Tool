import { getDemoContext } from '@/lib/db/store'
import { getSelection, setSelection } from '@/lib/db/repositories/config'
import { AppError, apiSuccess, withErrorHandling } from '@/lib/api/server'

export const GET = withErrorHandling(async () => {
  const { userId } = getDemoContext()
  const functionIds = await getSelection(userId)
  return apiSuccess({ functionIds })
})

export const PUT = withErrorHandling(async (request: Request) => {
  const { tenantId, userId } = getDemoContext()
  const body = (await request.json()) as { functionIds?: unknown }

  if (!Array.isArray(body.functionIds)) {
    throw new AppError('VALIDATION_ERROR', 'functionIds muss ein Array sein.', 400)
  }

  if (!body.functionIds.every((id) => typeof id === 'string')) {
    throw new AppError('VALIDATION_ERROR', 'functionIds enthält ungültige Einträge.', 400)
  }

  const functionIds = await setSelection(tenantId, userId, body.functionIds)
  return apiSuccess({ functionIds })
})
