const HIGH_URGENCY = [
  'kritisch',
  'sofort',
  'eil',
  'eilig',
  'eilauftrag',
  'express',
  'hoch',
  'sehrhoch',
  'dringend',
  'a',
  'prio1',
  'p1',
  'sehrhoch',
]

const MID_URGENCY = ['mittel', 'normal', 'standard', 'b', 'prio2', 'p2', 'planmassig', 'planmaessig']

const LOW_URGENCY = ['niedrig', 'gering', 'niedrige', 'c', 'prio3', 'p3', 'spaeter', 'spaet']

function strip(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '')
}

export function parseNumber(value: string): number | null {
  const raw = value.trim()
  if (!raw) return null

  const cleaned = raw.replace(/\s/g, '')
  const hasComma = cleaned.includes(',')
  const hasDot = cleaned.includes('.')

  let normalized = cleaned
  if (hasComma && hasDot) {
    normalized = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '')
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.')
  }

  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

export function parseDate(value: string, now = new Date()): Date | null {
  const raw = value.trim()
  if (!raw) return null

  const excelSerial = Number(raw)
  if (raw !== '' && Number.isFinite(excelSerial) && excelSerial > 20000 && excelSerial < 80000) {
    const utc = Date.UTC(1899, 11, 30) + excelSerial * 86400000
    const date = new Date(utc)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) {
    const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    return Number.isNaN(date.getTime()) ? null : date
  }

  const de = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})/)
  if (de) {
    let year = Number(de[3])
    if (year < 100) year += year >= 70 ? 1900 : 2000
    const date = new Date(year, Number(de[2]) - 1, Number(de[1]))
    return Number.isNaN(date.getTime()) ? null : date
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed

  void now
  return null
}

export function urgencyScore(value: string): number | null {
  const raw = value.trim()
  if (!raw) return null

  const numeric = parseNumber(raw)
  if (numeric !== null) {
    if (numeric >= 0 && numeric <= 1) return numeric * 100
    if (numeric >= 0 && numeric <= 5) return Math.round(((6 - numeric) / 5) * 100)
    if (numeric >= 1 && numeric <= 10) return Math.round(((11 - numeric) / 10) * 100)
    if (numeric >= 0 && numeric <= 100) return numeric
  }

  const key = strip(raw)
  if (HIGH_URGENCY.includes(key) || key.includes('eil') || key.includes('kritisch') || key.includes('dringend')) {
    return 100
  }
  if (MID_URGENCY.includes(key)) return 55
  if (LOW_URGENCY.includes(key) || key.includes('niedrig')) return 20

  return 45
}

export function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function formatDateDe(value: string): string {
  const date = parseDate(value)
  if (!date) return value
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}
