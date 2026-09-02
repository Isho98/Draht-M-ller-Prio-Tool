import { NextRequest } from 'next/server'
import { apiSuccess, AppError, withErrorHandling } from '@/lib/api/server'
import { getFeinplanungSettings } from '@/lib/db/repositories/feinplanung'
import { getJob, updateJob } from '@/lib/modules/feinplanung'
import { prioritizeOrders } from '@/lib/modules/feinplanung/service'

export const runtime = 'nodejs'

export const POST = withErrorHandling(async (request: NextRequest) => {
  let body: { jobId?: string; methodId?: string }
  try {
    body = await request.json()
  } catch {
    throw new AppError('BAD_JSON', 'Die Anfrage ist ungültig. Bitte die Seite neu laden und erneut versuchen.', 400)
  }
  if (!body.jobId) {
    throw new AppError('NO_JOB', 'Die Sitzung ist ungültig. Bitte die Datei erneut hochladen.', 400)
  }
  const job = getJob(body.jobId)
  const settings = await getFeinplanungSettings()
  const methodId = body.methodId ?? settings.methodId ?? job.methodId
  const { result, open, done } = prioritizeOrders([...job.orders, ...job.completedOrders], settings, methodId)
  updateJob(job.id, { result, methodId, orders: open, completedOrders: done })
  return apiSuccess(result)
})
