import { NextRequest } from 'next/server'
import { apiSuccess, AppError, withErrorHandling } from '@/lib/api/server'
import { logEvent } from '@/lib/logging'
import { getFeinplanungSettings } from '@/lib/db/repositories/feinplanung'
import { assertExcelFile, parseExcelBuffer, saveJob } from '@/lib/modules/feinplanung'
import { prioritizeTableRows } from '@/lib/modules/feinplanung/service'
import { DASHBOARD_COLUMNS, DONE_COLUMNS } from '@/lib/modules/feinplanung/schema'

export const runtime = 'nodejs'

export const POST = withErrorHandling(async (request: NextRequest) => {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    throw new AppError('BAD_UPLOAD', 'Der Upload konnte nicht gelesen werden. Bitte die Datei erneut wählen.', 400)
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    throw new AppError('NO_FILE', 'Bitte eine Excel-Datei auswählen.', 400)
  }

  const settings = await getFeinplanungSettings()
  const methodId = String(form.get('methodId') || settings.methodId)

  assertExcelFile(file.name, file.size)

  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch {
    throw new AppError(
      'FILE_READ',
      'Die Datei konnte nicht gelesen werden. Falls sie geöffnet ist, bitte schließen und erneut versuchen.',
      400,
    )
  }

  const table = parseExcelBuffer(buffer, file.name)
  const { result, open, done } = prioritizeTableRows(table.rows, settings, methodId)
  const job = saveJob(table, { methodId, orders: open, completedOrders: done })
  job.result = result

  logEvent({
    level: 'info',
    module: 'feinplanung.upload',
    code: 'OK',
    message: `${table.fileName} eingelesen (${table.rows.length} Zeilen, ${open.length} offen).`,
  })
  return apiSuccess({
    jobId: job.id,
    fileName: table.fileName,
    sheetName: table.sheetName,
    rowCount: table.rows.length,
    openCount: open.length,
    completedCount: done.length,
    columns: [...DASHBOARD_COLUMNS],
    doneColumns: [...DONE_COLUMNS],
    result,
  })
})
