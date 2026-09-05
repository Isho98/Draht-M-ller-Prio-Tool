import * as XLSX from 'xlsx'
import { AppError } from '@/lib/api/server'
import { assertExcelColumns, findColumn } from './schema'
import type { ParsedTable, PrioritizedRow } from './types'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_EXT = ['.xlsx', '.xls']

function extensionOf(fileName: string): string {
  const i = fileName.lastIndexOf('.')
  return i >= 0 ? fileName.slice(i).toLowerCase() : ''
}

export function assertExcelFile(fileName: string, size: number) {
  if (size > MAX_BYTES) {
    throw new AppError('FILE_TOO_LARGE', 'Die Datei ist zu groß. Maximal 10 MB sind erlaubt.', 413)
  }
  if (!ALLOWED_EXT.includes(extensionOf(fileName))) {
    throw new AppError(
      'INVALID_FORMAT',
      'Diese Datei kann nicht gelesen werden. Bitte eine Excel-Datei (.xlsx oder .xls) wählen.',
      400,
    )
  }
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) {
    const dd = String(value.getDate()).padStart(2, '0')
    const mm = String(value.getMonth() + 1).padStart(2, '0')
    return `${dd}.${mm}.${value.getFullYear()}`
  }
  return String(value).trim()
}

function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>()
  return headers.map((header, index) => {
    const base = header || `Spalte ${index + 1}`
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base} (${count + 1})`
  })
}

export function parseExcelBuffer(buffer: Buffer, fileName: string): ParsedTable {
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellNF: false, raw: false })
  } catch {
    throw new AppError(
      'INVALID_EXCEL',
      'Die Excel-Datei ist beschädigt oder kein gültiges Tabellenformat. Bitte eine andere Datei wählen.',
      400,
    )
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new AppError('EMPTY_WORKBOOK', 'Die Datei enthält keine Tabelle. Bitte eine Datei mit mindestens einem Blatt wählen.', 400)
  }

  let matrix: (string | number | Date | null)[][]
  try {
    const sheet = workbook.Sheets[sheetName]
    matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    }) as (string | number | Date | null)[][]
  } catch {
    throw new AppError(
      'SHEET_UNREADABLE',
      'Die Tabelle konnte nicht gelesen werden. Bitte prüfen, ob die Datei geöffnet oder geschützt ist, und erneut versuchen.',
      400,
    )
  }

  const headerIndex = matrix.findIndex((row) => {
    if (!Array.isArray(row)) return false
    const cells = row.map((cell) => cellToString(cell).toLowerCase())
    return cells.includes('prod-ende') && cells.includes('auftnr') && cells.includes('maschinen')
  })

  if (headerIndex < 0) {
    throw new AppError(
      'NO_HEADER',
      'Die Kopfzeile mit Prod-Ende, AuftNr und Maschinen wurde nicht gefunden. Bitte eine Datei im bekannten Listenformat hochladen.',
      400,
    )
  }

  const headerRow = matrix[headerIndex].map((cell) => cellToString(cell))
  const columns = uniqueHeaders(headerRow)
  assertExcelColumns(columns)

  const prodCol = findColumn(columns, ['Prod-Ende'])
  const auftCol = findColumn(columns, ['AuftNr'])
  const rows: Record<string, string>[] = []

  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const row = matrix[i]
    if (!row) continue
    const record: Record<string, string> = {}
    let hasValue = false
    columns.forEach((column, index) => {
      const value = cellToString(row[index])
      record[column] = value
      if (value) hasValue = true
    })
    if (!hasValue) continue
    const hasPosition = Boolean((prodCol && record[prodCol]) || (auftCol && record[auftCol]))
    if (!hasPosition) continue
    rows.push(record)
  }

  if (rows.length === 0) {
    throw new AppError('NO_ROWS', 'Die Tabelle enthält keine Datenzeilen.', 400)
  }

  return { fileName, sheetName, columns, rows }
}

export function buildExportWorkbook(rows: PrioritizedRow[], originalName: string): { filename: string; buffer: Buffer } {
  try {
    const data = rows.map((row) => ({
      Prio: row.rank,
      Bewertung: row.score,
      Begründung: row.reasons.join(' · '),
      ...row.values,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Priorisierung')
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    const base = originalName.replace(/\.(xlsx|xls)$/i, '') || 'export'
    return {
      filename: `${base}_priorisiert.xlsx`,
      buffer,
    }
  } catch {
    throw new AppError(
      'EXPORT_FAILED',
      'Der Export konnte nicht erstellt werden. Bitte erneut versuchen. Falls die Datei geöffnet ist, zuerst schließen.',
      500,
    )
  }
}
