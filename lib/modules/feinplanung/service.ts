import { doneRowFromOrder, finishResult, rowsToPlanningOrders, splitOpenAndDone } from './orders'
import { runPriorityMethod } from './methods/registry'
import type { FeinplanungSettings } from './settings'
import type { PlanningOrder, PrioritizeResult } from './types'

export function prioritizeOrders(
  orders: PlanningOrder[],
  settings: FeinplanungSettings,
  methodId?: string,
): { result: PrioritizeResult; open: PlanningOrder[]; done: PlanningOrder[] } {
  const { open, done } = splitOpenAndDone(orders)
  const resolvedMethod = methodId ?? settings.methodId
  const completed = done.map((order) => doneRowFromOrder(order))

  if (open.length === 0) {
    return {
      result: finishResult([], resolvedMethod, ['Alle Positionen sind bereits erledigt (Status F).'], completed),
      open,
      done,
    }
  }

  const result = runPriorityMethod({
    methodId: resolvedMethod,
    orders: open,
    settings,
  })
  result.completedRows = completed.map((row, index) => ({ ...row, rank: index + 1 }))
  return { result, open, done }
}

export function prioritizeTableRows(
  rows: Record<string, string>[],
  settings: FeinplanungSettings,
  methodId?: string,
) {
  return prioritizeOrders(rowsToPlanningOrders(rows), settings, methodId)
}
