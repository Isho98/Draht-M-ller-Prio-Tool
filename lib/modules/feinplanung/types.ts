export const CANONICAL_FIELDS = [
  'orderId',
  'customer',
  'article',
  'quantity',
  'dueDate',
  'urgency',
  'startDate',
  'workstation',
] as const

export type CanonicalField = (typeof CANONICAL_FIELDS)[number]

export type ColumnMapping = Partial<Record<CanonicalField, string | null>>

export type PriorityRuleType = 'date' | 'urgency' | 'number' | 'order'

export type PriorityRule = {
  id: string
  field: CanonicalField | 'sourceIndex'
  type: PriorityRuleType
  weight: number
  label: string
}

export type ParsedTable = {
  fileName: string
  sheetName: string
  columns: string[]
  rows: Record<string, string>[]
}

export type CanonicalValues = Record<CanonicalField, string>

export type PrioritizedRow = {
  rank: number
  score: number
  reasons: string[]
  sourceIndex: number
  values: Record<string, string>
  canonical: CanonicalValues
}

export type PrioritizeResult = {
  rows: PrioritizedRow[]
  appliedRules: PriorityRule[]
  mapping: ColumnMapping
  skippedRules: string[]
}

export type PriorityEngine = {
  id: string
  name: string
  prioritize: (input: {
    rows: Record<string, string>[]
    mapping: ColumnMapping
    rules?: PriorityRule[]
    now?: Date
  }) => PrioritizeResult
}
