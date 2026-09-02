import { NextRequest } from 'next/server'
import { apiSuccess, AppError, withErrorHandling } from '@/lib/api/server'
import { getFeinplanungSettings } from '@/lib/db/repositories/feinplanung'
import { saveJob } from '@/lib/modules/feinplanung'
import { ordersToDisplayRows } from '@/lib/modules/feinplanung/orders'
import { prioritizeOrders } from '@/lib/modules/feinplanung/service'
import { DASHBOARD_COLUMNS, DONE_COLUMNS } from '@/lib/modules/feinplanung/schema'
import type { PlanningOrder } from '@/lib/modules/feinplanung/types'

export const runtime = 'nodejs'

export const POST = withErrorHandling(async (request: NextRequest) => {
  let body: { orders?: PlanningOrder[]; methodId?: string }
  try {
    body = await request.json()
  } catch {
    throw new AppError('BAD_JSON', 'Die Testdaten konnten nicht gelesen werden. Bitte die Eingaben prüfen.', 400)
  }

  const settings = await getFeinplanungSettings()
  const methodId = body.methodId ?? settings.methodId
  const orders = (body.orders ?? []).map((order, index) => ({
    ...order,
    customer: order.customer ?? '',
    article: order.article ?? '',
    statusF: order.statusF ?? '',
    completed: Boolean(order.completed || order.statusF),
    machines: order.machines ?? [],
    extra: order.extra ?? {},
    sourceIndex: index,
  }))
  const { result, open, done } = prioritizeOrders(orders, settings, methodId)
  const display = ordersToDisplayRows(orders)
  const job = saveJob(
    {
      fileName: 'testdaten',
      sheetName: 'Vorschau',
      columns: display.columns,
      rows: display.rows,
    },
    { methodId, orders: open, completedOrders: done },
  )
  job.result = result

  return apiSuccess({
    jobId: job.id,
    fileName: 'Testdaten (Vorschau)',
    columns: [...DASHBOARD_COLUMNS],
    doneColumns: [...DONE_COLUMNS],
    result,
  })
})
