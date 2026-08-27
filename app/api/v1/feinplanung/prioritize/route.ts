import { NextRequest } from 'next/server'
import { apiSuccess, AppError, withErrorHandling } from '@/lib/api/server'
import { defaultPriorityEngine, getJob, updateJob } from '@/lib/modules/feinplanung'
import type { ColumnMapping } from '@/lib/modules/feinplanung/types'

export const runtime = 'nodejs'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = (await request.json()) as { jobId?: string; mapping?: ColumnMapping }
  if (!body.jobId) {
    throw new AppError('NO_JOB', 'Die Sitzung ist ungültig. Bitte die Datei erneut hochladen.', 400)
  }
  const job = getJob(body.jobId)
  const mapping = body.mapping ?? job.mapping
  const result = defaultPriorityEngine.prioritize({
    rows: job.table.rows,
    mapping,
  })
  updateJob(job.id, { mapping, result })
  return apiSuccess(result)
})
