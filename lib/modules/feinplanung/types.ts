export const CANONICAL_FIELDS = [
  'orderId',
  'customer',
  'article',
  'quantity',
  'dueDate',
  'urgency',
  'startDate',
  'workstation',
  'remainingHours',
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

export type MachineHours = {
  id: string
  name: string
  remainingHours: number
}

/** @deprecated Use MachineHours */
export type PlantInput = MachineHours

export type PlanningOrder = {
  id: string
  name: string
  customer: string
  article: string
  dueDate: string
  statusF: string
  completed: boolean
  machines: MachineHours[]
  extra: Record<string, string>
  sourceIndex: number
}

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
  completedRows: PrioritizedRow[]
  appliedRules: PriorityRule[]
  mapping: ColumnMapping
  skippedRules: string[]
  warnings: string[]
  methodId: string
}

export type MethodContext = {
  orders: PlanningOrder[]
  mapping: ColumnMapping
  now: Date
  ignoreMachines: string[]
  customerPriorities: Record<string, number>
  weights: import('./settings').PriorityWeights
  weekdayCapacity: import('./settings').WeekdayCapacity
}

export type PriorityMethod = {
  id: string
  label: string
  description: string
  live: boolean
  prioritize: (ctx: MethodContext) => PrioritizeResult
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
