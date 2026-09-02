import type { CanonicalField, ColumnMapping } from './types'
import { CANONICAL_FIELDS } from './types'

export const FIELD_LABELS: Record<CanonicalField, string> = {
  orderId: 'Auftragsnummer',
  customer: 'Kunde',
  article: 'Artikel',
  quantity: 'Menge',
  dueDate: 'Liefertermin',
  urgency: 'Dringlichkeit',
  startDate: 'Starttermin',
  workstation: 'Anlage',
  remainingHours: 'Restlaufzeit (h)',
}

const ALIASES: Record<CanonicalField, string[]> = {
  orderId: [
    'auftragsnummer',
    'auftrag',
    'auftragsnr',
    'auftrag-nr',
    'auftragnr',
    'aufnr',
    'fa',
    'fertigungsauftrag',
    'beleg',
    'belegnr',
    'belegnummer',
    'order',
    'orderid',
    'orderno',
    'ordernumber',
    'order-no',
    'id',
  ],
  customer: [
    'kunde',
    'kundenname',
    'kundennr',
    'kundennummer',
    'kunnr',
    'customer',
    'customername',
    'debitor',
  ],
  article: [
    'artikel',
    'artikelnummer',
    'artikelnr',
    'matnr',
    'material',
    'materialnr',
    'materialnummer',
    'produkt',
    'teil',
    'bauteil',
    'sku',
    'article',
    'part',
  ],
  quantity: [
    'menge',
    'stuck',
    'stueck',
    'stück',
    'anzahl',
    'qty',
    'quantity',
    'losgrose',
    'losgroesse',
    'losgröße',
    'gamng',
    'psmng',
  ],
  dueDate: [
    'liefertermin',
    'lieferdatum',
    'endtermin',
    'fertigstellungstermin',
    'solltermin',
    'wunschtermin',
    'wunschliefertermin',
    'termin',
    'faelligkeit',
    'fälligkeit',
    'due',
    'duedate',
    'deadline',
    'lfdat',
    'edatu',
    'gltrp',
    'ftrmi',
    'enddate',
  ],
  urgency: [
    'dringlichkeit',
    'prioritat',
    'priorität',
    'prio',
    'eilig',
    'eilkennzeichen',
    'kennzeichen',
    'urgency',
    'priority',
    'priori',
    'status',
  ],
  startDate: [
    'starttermin',
    'start',
    'beginn',
    'startdatum',
    'gstrp',
    'startdate',
    'anfang',
  ],
  workstation: [
    'arbeitsplatz',
    'maschine',
    'arbpl',
    'arbeitsgang',
    'ressource',
    'werk',
    'workstation',
    'resource',
    'ag',
    'anlage',
    'anlagen',
    'anlagenbezeichnung',
  ],
  remainingHours: [
    'restlaufzeit',
    'restlaufzeitstunden',
    'restlauf',
    'reststunden',
    'laufzeit',
    'aufwand',
    'stunden',
    'hours',
    'remaining',
    'remaininghours',
  ],
}

export function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '')
}

export function suggestMapping(columns: string[]): ColumnMapping {
  const used = new Set<string>()
  const mapping: ColumnMapping = {}

  for (const field of CANONICAL_FIELDS) {
    const match = columns.find((column) => {
      if (used.has(column)) return false
      const key = normalizeKey(column)
      return ALIASES[field].includes(key) || key === field.toLowerCase()
    })
    if (match) {
      mapping[field] = match
      used.add(match)
    } else {
      mapping[field] = null
    }
  }

  return mapping
}

export function mappingNeedsReview(mapping: ColumnMapping): boolean {
  const hasIdentity = Boolean(mapping.orderId || mapping.article)
  const hasPrioritySignal = Boolean(mapping.dueDate || mapping.urgency || mapping.remainingHours)
  return !hasIdentity || !hasPrioritySignal
}
