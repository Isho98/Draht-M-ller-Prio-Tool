import { AppError } from '@/lib/errors'

export const EXCEL_FIELDS = {
  prodEnde: { label: 'Prod-Ende', names: ['Prod-Ende'] },
  auftNr: { label: 'AuftNr', names: ['AuftNr'] },
  abruf: { label: 'Abruf', names: ['Abruf', 'Abrufnummer'] },
  name: { label: 'Name', names: ['Name'] },
  maschinen: { label: 'Maschinen', names: ['Maschinen'] },
  artikelnr: { label: 'Artikelnr.', names: ['Artikelnr.', 'Artikelnr'] },
  offen: { label: 'offen', names: ['offen', 'Menge'] },
  geliefert: { label: 'geliefert', names: ['geliefert'] },
  gefertigt: { label: 'gefertigt', names: ['gefertigt'] },
  gefertigtLa: { label: 'gefertigt LA', names: ['gefertigt LA', 'gefertig LA'] },
  f: { label: 'F', names: ['F'] },
  fl: { label: 'FL', names: ['FL'] },
} as const

export type ExcelField = keyof typeof EXCEL_FIELDS

const REQUIRED_FIELDS: ExcelField[] = [
  'prodEnde',
  'auftNr',
  'abruf',
  'name',
  'maschinen',
  'artikelnr',
  'offen',
  'geliefert',
  'gefertigt',
  'gefertigtLa',
  'f',
  'fl',
]

const CORE_FIELDS: ExcelField[] = ['prodEnde', 'auftNr', 'name', 'maschinen', 'f']

export const DASHBOARD_COLUMNS = [
  'Auftrag',
  'Abrufnummer',
  'Kunde',
  'Artikel',
  'Menge',
  'Prio',
  'Maschine',
] as const

export const DONE_COLUMNS = ['Auftrag', 'Kunde', 'Artikel', 'Menge', 'F'] as const

export function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function findColumn(columns: string[], names: readonly string[]): string | null {
  const wanted = names.map(normalizeHeader)
  return columns.find((column) => wanted.includes(normalizeHeader(column))) ?? null
}

export function columnMap(columns: string[], fields: ExcelField[] = REQUIRED_FIELDS): Record<ExcelField, string> {
  const missing: string[] = []
  const map = {} as Record<ExcelField, string>
  for (const field of fields) {
    const found = findColumn(columns, EXCEL_FIELDS[field].names)
    if (!found) missing.push(EXCEL_FIELDS[field].label)
    else map[field] = found
  }
  if (missing.length > 0) {
    throw new AppError(
      'MISSING_COLUMNS',
      `In der Excel-Datei fehlen erwartete Spalten: ${missing.join(', ')}. Bitte eine Datei im bekannten Listenformat hochladen.`,
      400,
      { missing },
    )
  }
  for (const field of REQUIRED_FIELDS) {
    if (!map[field]) {
      const found = findColumn(columns, EXCEL_FIELDS[field].names)
      if (found) map[field] = found
      else map[field] = EXCEL_FIELDS[field].label
    }
  }
  return map
}

export function assertExcelColumns(columns: string[]) {
  columnMap(columns, REQUIRED_FIELDS)
}

export function coreColumnMap(columns: string[]): Record<ExcelField, string> {
  return columnMap(columns, CORE_FIELDS)
}

export function readField(
  row: Record<string, string>,
  columns: Record<ExcelField, string>,
  field: ExcelField,
): string {
  const column = columns[field]
  if (!column) return ''
  return (row[column] ?? '').trim()
}

export function extraValue(extra: Record<string, string>, names: readonly string[]): string {
  for (const name of names) {
    const found = Object.keys(extra).find((key) => normalizeHeader(key) === normalizeHeader(name))
    if (found && extra[found]?.trim()) return extra[found].trim()
  }
  return ''
}

export function isCompletedStatus(value: string): boolean {
  return value.trim() !== ''
}
