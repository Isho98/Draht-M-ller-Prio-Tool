import { orderToPrioritizedShape, finishResult, validateOrders } from '../orders'
import { relevantMachines, remainingHoursOf, formatHours } from '../machines'
import type { PriorityMethod } from '../types'

export const remainingTimeMethod: PriorityMethod = {
  id: 'remaining-time',
  label: 'Nur Restaufwand',
  description: 'Höchster relevanter Maschinenaufwand hat die höchste Priorität.',
  live: true,
  prioritize({ orders, ignoreMachines }) {
    const warnings = validateOrders(orders)
    const scored = orders.map((order) => {
      const remaining = remainingHoursOf(relevantMachines(order.machines, ignoreMachines))
      const reasons = remaining > 0 ? [`Restaufwand ${formatHours(remaining)} h`] : ['Kein relevanter Restaufwand']
      return orderToPrioritizedShape(order, remaining, reasons, {
        ignoreMachines,
        remainingHours: remaining,
      })
    })
    return finishResult(scored, 'remaining-time', [...new Set(warnings)])
  },
}
