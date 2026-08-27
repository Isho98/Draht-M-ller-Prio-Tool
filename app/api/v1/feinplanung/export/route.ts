import { NextRequest, NextResponse } from 'next/server'
import { AppError, withErrorHandling } from '@/lib/api/server'
import { buildExportWorkbook, getJob } from '@/lib/modules/feinplanung'

export const runtime = 'nodejs'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = (await request.json()) as { jobId?: string }
  if (!body.jobId) {
    throw new AppError('NO_JOB', 'Die Sitzung ist ungültig. Bitte die Datei erneut hochladen.', 400)
  }
  const job = getJob(body.jobId)
  if (!job.result) {
    throw new AppError('NO_RESULT', 'Es liegt noch kein priorisiertes Ergebnis vor.', 400)
  }
  const exported = buildExportWorkbook(job.result.rows, job.table.fileName)
  return new NextResponse(new Uint8Array(exported.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${exported.filename}"`,
    },
  })
})
