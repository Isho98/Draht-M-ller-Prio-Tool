import { runPriorityOnRows } from './methods/registry'
import type { PriorityEngine } from './types'

/** @deprecated Use runPriorityOnRows / getPriorityMethod. Kept as adapter. */
export const DEFAULT_RULES = []

export const defaultPriorityEngine: PriorityEngine = {
  id: 'capacity-deadline',
  name: 'Puffer aus Prod-Ende & Maschinenaufwand',
  prioritize({ rows, now }) {
    return runPriorityOnRows({ rows, now })
  },
}

export function createDeadlineUrgencyEngine(): PriorityEngine {
  return defaultPriorityEngine
}
