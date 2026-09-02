import { NextRequest, NextResponse } from 'next/server'
import { AppError, withErrorHandling } from '@/lib/api/server'
import { withRetry } from '@/lib/logging'
import { buildExportWorkbook, getJob } from '@/lib/modules/feinplanung'

export const runtime = 'nodejs'

export const POST = withErrorHandling(async (request: NextRequest) => {
  let body: { jobId?: string }
  try {
    body = await request.json()
  } catch {
    throw new AppError('BAD_JSON', 'Die Anfrage ist ungültig. Bitte erneut versuchen.', 400)
  }
  if (!body.jobId) {
    throw new AppError('NO_JOB', 'Die Sitzung ist ungültig. Bitte die Datei erneut hochladen.', 400)
  }
  const job = getJob(body.jobId)
  if (!job.result) {
    throw new AppError('NO_RESULT', 'Es liegt noch kein priorisiertes Ergebnis vor.', 400)
  }

  const exported = await withRetry(() => Promise.resolve(buildExportWorkbook(job.result!.rows, job.table.fileName)))
  return new NextResponse(new Uint8Array(exported.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${exported.filename}"`,
    },
  })
})
