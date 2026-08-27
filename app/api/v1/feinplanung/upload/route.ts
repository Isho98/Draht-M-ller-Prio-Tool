import { NextRequest } from 'next/server'
import { apiSuccess, AppError, withErrorHandling } from '@/lib/api/server'
import {
  assertExcelFile,
  defaultPriorityEngine,
  mappingNeedsReview,
  parseExcelBuffer,
  saveJob,
  suggestMapping,
} from '@/lib/modules/feinplanung'

export const runtime = 'nodejs'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    throw new AppError('NO_FILE', 'Bitte eine Excel-Datei auswählen.', 400)
  }

  assertExcelFile(file.name, file.size)
  const buffer = Buffer.from(await file.arrayBuffer())
  const table = parseExcelBuffer(buffer, file.name)
  const suggestedMapping = suggestMapping(table.columns)
  const job = saveJob(table, suggestedMapping)
  const result = defaultPriorityEngine.prioritize({
    rows: table.rows,
    mapping: suggestedMapping,
  })
  job.result = result
  return apiSuccess({
    jobId: job.id,
    fileName: table.fileName,
    sheetName: table.sheetName,
    rowCount: table.rows.length,
    columns: table.columns,
    suggestedMapping,
    mapping: suggestedMapping,
    needsReview: mappingNeedsReview(suggestedMapping),
    result,
  })
})
