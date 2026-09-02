import { hoursUntilDue, orderToPrioritizedShape, finishResult, validateOrders } from '../orders'
import { relevantMachines, remainingHoursOf, formatHours } from '../machines'
import type { PriorityMethod } from '../types'

export const dueDateOnlyMethod: PriorityMethod = {
  id: 'due-date',
  label: 'Nur Prod-Ende',
  description: 'Frühestes Prod-Ende hat die höchste Priorität.',
  live: true,
  prioritize({ orders, now, ignoreMachines }) {
    const warnings = validateOrders(orders)
    const scored = orders.map((order) => {
      const remaining = remainingHoursOf(relevantMachines(order.machines, ignoreMachines))
      const hoursLeft = hoursUntilDue(order.dueDate, now)
      if (hoursLeft === null) {
        warnings.push(`Prod-Ende bei „${order.name}“ fehlt oder ist ungültig.`)
        return orderToPrioritizedShape(order, 0, ['Kein gültiges Prod-Ende'], {
          ignoreMachines,
          remainingHours: remaining,
        })
      }
      const reasons =
        hoursLeft < 0
          ? [`Prod-Ende überschritten (${Math.abs(Math.round(hoursLeft / 24))} Tage)`]
          : [`Prod-Ende in ${Math.max(0, Math.round(hoursLeft / 24))} Tagen`]
      return orderToPrioritizedShape(order, 10_000 - hoursLeft, reasons, {
        ignoreMachines,
        remainingHours: remaining,
      })
    })
    return finishResult(scored, 'due-date', [...new Set(warnings)])
  },
}
