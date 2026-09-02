import { AppError } from '@/lib/errors'
import { logEvent } from '@/lib/logging'
import { rowsToPlanningOrders, splitOpenAndDone } from '../orders'
import { DEFAULT_FEINPLANUNG_SETTINGS, type FeinplanungSettings } from '../settings'
import type { PlanningOrder, PrioritizeResult, PriorityMethod } from '../types'
import { capacityDeadlineMethod } from './capacity-deadline'
import { dueDateOnlyMethod } from './due-date'
import { remainingTimeMethod } from './remaining-time'

const manualMethod: PriorityMethod = {
  id: 'manual',
  label: 'Manuelle Reihenfolge',
  description: 'Später per Drag-and-Drop. In dieser Testversion noch nicht aktiv.',
  live: false,
  prioritize() {
    throw new AppError(
      'METHOD_UNAVAILABLE',
      'Die manuelle Priorisierung ist in dieser Testversion noch nicht verfügbar. Bitte eine andere Methode wählen.',
      400,
    )
  },
}

export const PRIORITY_METHODS: PriorityMethod[] = [
  capacityDeadlineMethod,
  dueDateOnlyMethod,
  remainingTimeMethod,
  manualMethod,
]

export const DEFAULT_METHOD_ID = capacityDeadlineMethod.id

export function getPriorityMethod(id?: string | null): PriorityMethod {
  const requested = id || DEFAULT_METHOD_ID
  const method = PRIORITY_METHODS.find((item) => item.id === requested)
  if (!method) {
    throw new AppError(
      'UNKNOWN_METHOD',
      'Diese Priorisierungsmethode ist unbekannt. Bitte eine andere Methode wählen.',
      400,
    )
  }
  if (!method.live) {
    throw new AppError(
      'METHOD_UNAVAILABLE',
      `„${method.label}“ ist in dieser Testversion noch nicht verfügbar.`,
      400,
    )
  }
  return method
}

function customerMap(settings: FeinplanungSettings): Record<string, number> {
  const map: Record<string, number> = {}
  for (const entry of settings.customerPriorities) {
    map[entry.name] = entry.percent
  }
  return map
}

export function runPriorityMethod(input: {
  methodId?: string
  orders: PlanningOrder[]
  settings?: FeinplanungSettings
  now?: Date
}): PrioritizeResult {
  const settings = input.settings ?? DEFAULT_FEINPLANUNG_SETTINGS
  try {
    const method = getPriorityMethod(input.methodId ?? settings.methodId)
    return method.prioritize({
      orders: input.orders,
      mapping: {},
      now: input.now ?? new Date(),
      ignoreMachines: settings.ignoreMachines,
      customerPriorities: customerMap(settings),
      weights: settings.weights,
      weekdayCapacity: settings.weekdayCapacity,
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    logEvent({
      level: 'error',
      module: 'feinplanung.method',
      code: 'METHOD_FAILED',
      message: 'Die Priorisierung ist fehlgeschlagen.',
      context: { methodId: input.methodId },
    })
    throw new AppError(
      'PRIORITIZE_FAILED',
      'Die Priorisierung konnte nicht berechnet werden. Bitte Eingaben prüfen und erneut versuchen.',
      500,
    )
  }
}

export function runPriorityOnRows(input: {
  methodId?: string
  rows: Record<string, string>[]
  settings?: FeinplanungSettings
  now?: Date
}): PrioritizeResult {
  const all = rowsToPlanningOrders(input.rows)
  const { open } = splitOpenAndDone(all)
  return runPriorityMethod({
    methodId: input.methodId,
    orders: open,
    settings: input.settings,
    now: input.now,
  })
}
