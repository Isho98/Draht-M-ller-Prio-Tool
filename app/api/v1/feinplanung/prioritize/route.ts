import { NextRequest } from 'next/server'
import { apiSuccess, AppError, withErrorHandling } from '@/lib/api/server'
import { getFeinplanungSettings } from '@/lib/db/repositories/feinplanung'
import { findJob, saveJob, updateJob } from '@/lib/modules/feinplanung'
import { normalizePlanningOrders } from '@/lib/modules/feinplanung/orders'
import { prioritizeOrders } from '@/lib/modules/feinplanung/service'
import { mergeFeinplanungSettings, type FeinplanungSettings } from '@/lib/modules/feinplanung/settings'
import type { PlanningOrder } from '@/lib/modules/feinplanung/types'

export const runtime = 'nodejs'

export const POST = withErrorHandling(async (request: NextRequest) => {
  let body: {
    jobId?: string
    methodId?: string
    orders?: PlanningOrder[]
    settings?: Partial<FeinplanungSettings>
  }
  try {
    body = await request.json()
  } catch {
    throw new AppError('BAD_JSON', 'Die Anfrage ist ungültig. Bitte die Seite neu laden und erneut versuchen.', 400)
  }

  const job = body.jobId ? findJob(body.jobId) : null
  const storedOrders = body.orders?.length
    ? normalizePlanningOrders(body.orders)
    : job
      ? [...job.orders, ...job.completedOrders]
      : []

  if (storedOrders.length === 0) {
    throw new AppError(
      'JOB_NOT_FOUND',
      'Die Sitzung ist abgelaufen. Bitte die Excel-Datei erneut hochladen.',
      404,
    )
  }

  const settings = mergeFeinplanungSettings(await getFeinplanungSettings(), body.settings ?? {})
  const methodId = body.methodId ?? settings.methodId ?? job?.methodId
  const { result, open, done } = prioritizeOrders(storedOrders, settings, methodId)

  if (job) {
    updateJob(job.id, { result, methodId, orders: open, completedOrders: done })
  } else {
    const created = saveJob(
      {
        fileName: 'sitzung',
        sheetName: 'Priorisierung',
        columns: [],
        rows: [],
      },
      { methodId, orders: open, completedOrders: done },
    )
    created.result = result
  }

  return apiSuccess(result)
})
