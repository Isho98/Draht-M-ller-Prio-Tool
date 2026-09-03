import { NextRequest, NextResponse } from 'next/server'
import { AppError, withErrorHandling } from '@/lib/api/server'
import { withRetry } from '@/lib/logging'
import { buildExportWorkbook, findJob } from '@/lib/modules/feinplanung'
import type { PrioritizedRow } from '@/lib/modules/feinplanung/types'

export const runtime = 'nodejs'

export const POST = withErrorHandling(async (request: NextRequest) => {
  let body: { jobId?: string; fileName?: string; rows?: PrioritizedRow[] }
  try {
    body = await request.json()
  } catch {
    throw new AppError('BAD_JSON', 'Die Anfrage ist ungültig. Bitte erneut versuchen.', 400)
  }

  const job = body.jobId ? findJob(body.jobId) : null
  const rows = body.rows?.length ? body.rows : job?.result?.rows
  const fileName = body.fileName || job?.table.fileName || 'priorisierung.xlsx'

  if (!rows?.length) {
    throw new AppError('NO_RESULT', 'Es liegt noch kein priorisiertes Ergebnis vor.', 400)
  }

  const exported = await withRetry(() => Promise.resolve(buildExportWorkbook(rows, fileName)))
  return new NextResponse(new Uint8Array(exported.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${exported.filename}"`,
    },
  })
})
