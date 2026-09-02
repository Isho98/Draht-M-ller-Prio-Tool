import { bufferHours } from '../calendar'
import { relevantMachines, remainingHoursOf, formatHours } from '../machines'
import { customerPercentOf, effectiveBufferHours } from '../settings'
import { parseDate } from '../values'
import { finishResult, orderToPrioritizedShape, validateOrders } from '../orders'
import type { MethodContext, PriorityMethod } from '../types'

export const capacityDeadlineMethod: PriorityMethod = {
  id: 'capacity-deadline',
  label: 'Puffer aus Prod-Ende & Maschinenaufwand',
  description:
    'Standard: Rückwärtsrechnung ab Prod-Ende mit tatsächlichem Restaufwand, Tageskapazität und Kundenpriorität.',
  live: true,
  prioritize({ orders, now, ignoreMachines, weights, weekdayCapacity, customerPriorities }) {
    const warnings = validateOrders(orders)
    const settings = {
      ignoreMachines,
      customerPriorities: Object.entries(customerPriorities).map(([name, percent]) => ({
        id: name,
        name,
        percent,
      })),
      methodId: 'capacity-deadline',
      weights,
      weekdayCapacity,
    }

    const scored = orders.map((order) => {
      const relevant = relevantMachines(order.machines, ignoreMachines)
      const remaining = remainingHoursOf(relevant)
      const percent = customerPercentOf(order.customer, settings)
      const due = parseDate(order.dueDate, now)
      const reasons: string[] = []
      let buffer: number | null

      if (!due) {
        warnings.push(`Prod-Ende bei „${order.name}“ fehlt oder ist ungültig. Die Position wird nachrangig einsortiert.`)
        buffer = null
        reasons.push('Kein gültiges Prod-Ende')
      } else {
        buffer = bufferHours(remaining, due, now, weekdayCapacity)
        if (buffer < 0) reasons.push(`Puffer ${formatHours(buffer)} h — Termin gefährdet`)
        else reasons.push(`Puffer ${formatHours(buffer)} h bis ${order.dueDate}`)
        reasons.push(`Restaufwand ${formatHours(remaining)} h`)
      }

      if (percent !== weights.defaultCustomerPercent) {
        reasons.push(`Kundenprio ${String(percent).replace('.', ',')} %`)
      }

      const bottleneck = [...relevant].sort((a, b) => b.remainingHours - a.remainingHours)[0]
      if (bottleneck && bottleneck.remainingHours > 0) {
        reasons.push(`Größter Posten: ${bottleneck.name} (${formatHours(bottleneck.remainingHours)} h)`)
      }

      const effective = buffer === null ? Number.POSITIVE_INFINITY : effectiveBufferHours(buffer, percent, weights)
      const score = effective === Number.POSITIVE_INFINITY ? -1e9 : -effective
      return orderToPrioritizedShape(order, Math.round(score * 10) / 10, reasons, {
        ignoreMachines,
        remainingHours: remaining,
        bufferHours: buffer,
        customerPercent: percent,
      })
    })

    return finishResult(scored, 'capacity-deadline', [...new Set(warnings)])
  },
}
