import { NextRequest } from 'next/server'
import { apiSuccess, AppError, withErrorHandling } from '@/lib/api/server'
import { getFeinplanungSettings, saveFeinplanungSettings } from '@/lib/db/repositories/feinplanung'
import type { CustomerPriority, FeinplanungSettings } from '@/lib/modules/feinplanung/settings'

export const runtime = 'nodejs'

export const GET = withErrorHandling(async () => {
  const settings = await getFeinplanungSettings()
  return apiSuccess(settings)
})

export const PUT = withErrorHandling(async (request: NextRequest) => {
  let body: Partial<FeinplanungSettings> & { customerPriorities?: CustomerPriority[] }
  try {
    body = await request.json()
  } catch {
    throw new AppError('BAD_JSON', 'Die Einstellungen konnten nicht gelesen werden.', 400)
  }
  const settings = await saveFeinplanungSettings(body)
  return apiSuccess(settings)
})
