import { NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api/server'
import { buildSampleWorkbook } from '@/lib/modules/feinplanung'

export const runtime = 'nodejs'

export const GET = withErrorHandling(async () => {
  const sample = buildSampleWorkbook()
  return new NextResponse(new Uint8Array(sample.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${sample.filename}"`,
      'Cache-Control': 'no-store',
    },
  })
})
