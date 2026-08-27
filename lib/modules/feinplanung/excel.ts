import * as XLSX from 'xlsx'
import { AppError } from '@/lib/api/server'
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

function isEmptyCell(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === ''
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
      'Die Excel-Datei ist beschädigt oder kein gültiges Tabellenformat.',
      400,
    )
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new AppError('EMPTY_WORKBOOK', 'Die Datei enthält keine Tabelle.', 400)
  }

  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  })

  const headerIndex = matrix.findIndex(
    (row) => Array.isArray(row) && row.filter((cell) => !isEmptyCell(cell)).length >= 2,
  )

  if (headerIndex < 0) {
    throw new AppError(
      'NO_HEADER',
      'In der Datei wurde keine Kopfzeile gefunden. Bitte die erste Zeile mit Spaltennamen versehen.',
      400,
    )
  }

  const headerRow = matrix[headerIndex].map((cell) => cellToString(cell))
  const columns = uniqueHeaders(headerRow)
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
    if (hasValue) rows.push(record)
  }

  if (rows.length === 0) {
    throw new AppError('NO_ROWS', 'Die Tabelle enthält keine Datenzeilen.', 400)
  }

  return { fileName, sheetName, columns, rows }
}

export function buildExportWorkbook(rows: PrioritizedRow[], originalName: string): { filename: string; buffer: Buffer } {
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
  const base = originalName.replace(/\.(xlsx|xls)$/i, '')
  return {
    filename: `${base}_priorisiert.xlsx`,
    buffer,
  }
}
