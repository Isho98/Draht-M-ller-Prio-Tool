import { AppError } from '@/lib/errors'
import { logEvent } from '@/lib/logging'
import { parseDate } from './values'
import { coreColumnMap, isCompletedStatus, readField } from './schema'
import { formatHours, formatMaschinen, parseMaschinenField, relevantMachines, remainingHoursOf } from './machines'
import type { CanonicalValues, ColumnMapping, PlanningOrder, PrioritizeResult, PrioritizedRow } from './types'

export function emptyCanonical(): CanonicalValues {
  return {
    orderId: '',
    customer: '',
    article: '',
    quantity: '',
    dueDate: '',
    urgency: '',
    startDate: '',
    workstation: '',
    remainingHours: '',
  }
}

export function rowsToPlanningOrders(rows: Record<string, string>[]): PlanningOrder[] {
  const columns = coreColumnMap([...new Set(rows.flatMap((row) => Object.keys(row)))])

  return rows.map((row, index) => {
    const auftNr = readField(row, columns, 'auftNr')
    const customer = readField(row, columns, 'name')
    const article = readField(row, columns, 'artikelnr')
    const dueDate = readField(row, columns, 'prodEnde')
    const statusF = readField(row, columns, 'f')
    const id = auftNr ? `${auftNr}-${index}` : `row-${index}`
    const machines = parseMaschinenField(readField(row, columns, 'maschinen'), id)

    return {
      id,
      name: auftNr || article || `Position ${index + 1}`,
      customer,
      article,
      dueDate,
      statusF,
      completed: isCompletedStatus(statusF),
      machines,
      extra: { ...row },
      sourceIndex: index,
    }
  })
}

export function splitOpenAndDone(orders: PlanningOrder[]): {
  open: PlanningOrder[]
  done: PlanningOrder[]
} {
  const open: PlanningOrder[] = []
  const done: PlanningOrder[] = []
  for (const order of orders) {
    if (order.completed) done.push(order)
    else open.push(order)
  }
  return { open, done }
}

export function validateOrders(orders: PlanningOrder[]): string[] {
  const warnings: string[] = []
  if (orders.length === 0) {
    throw new AppError(
      'NO_ORDERS',
      'Es sind keine offenen Positionen vorhanden. Fertige Positionen (Status F) werden nicht priorisiert.',
      400,
    )
  }

  for (const order of orders) {
    if (!order.name.trim()) {
      throw new AppError('MISSING_NAME', 'Bitte für jede Position eine Auftragsnummer eintragen.', 400)
    }
    for (const machine of order.machines) {
      if (!Number.isFinite(machine.remainingHours)) {
        throw new AppError(
          'INVALID_HOURS',
          `Die offenen Stunden bei „${order.name}“ / „${machine.name}“ sind keine Zahl.`,
          400,
        )
      }
      if (machine.remainingHours < 0) {
        throw new AppError(
          'NEGATIVE_HOURS',
          `Die offenen Stunden bei „${order.name}“ dürfen nicht negativ sein.`,
          400,
        )
      }
    }
  }
  return warnings
}

export function ordersToDisplayRows(orders: PlanningOrder[]): { columns: string[]; rows: Record<string, string>[] } {
  const columns = ['Prod-Ende', 'AuftNr', 'Name', 'Artikelnr.', 'offen', 'Maschinen', 'F']
  const rows = orders.map((order) => ({
    'Prod-Ende': order.dueDate,
    AuftNr: order.name,
    Name: order.customer,
    'Artikelnr.': order.article,
    offen: order.extra.offen ?? '',
    Maschinen: formatMaschinen(order.machines),
    F: order.statusF,
  }))
  return { columns, rows }
}

export function orderToPrioritizedShape(
  order: PlanningOrder,
  score: number,
  reasons: string[],
  extras?: {
    ignoreMachines?: string[]
    remainingHours?: number
    bufferHours?: number | null
    customerPercent?: number
  },
): Omit<PrioritizedRow, 'rank'> {
  const relevant = relevantMachines(order.machines, extras?.ignoreMachines ?? [])
  const remaining = extras?.remainingHours ?? remainingHoursOf(relevant)
  const buffer =
    extras?.bufferHours === undefined || extras.bufferHours === null ? '' : formatHours(extras.bufferHours)
  const customerPercent = extras?.customerPercent
  const values: Record<string, string> = {
    ...order.extra,
    'Prod-Ende': order.dueDate,
    AuftNr: order.name,
    Name: order.customer,
    'Artikelnr.': order.article,
    offen: order.extra.offen ?? '',
    Maschinen: formatMaschinen(relevant),
    'Restaufwand (h)': formatHours(remaining),
    'Puffer (h)': buffer || '—',
    Kundenprio: customerPercent == null ? '—' : `${String(customerPercent).replace('.', ',')} %`,
    F: order.statusF,
  }

  return {
    score,
    reasons,
    sourceIndex: order.sourceIndex,
    values,
    canonical: {
      ...emptyCanonical(),
      orderId: order.name,
      customer: order.customer,
      article: order.article,
      dueDate: order.dueDate,
      workstation: formatMaschinen(relevant),
      remainingHours: formatHours(remaining),
    },
  }
}

export function finishResult(
  scored: Array<Omit<PrioritizedRow, 'rank'>>,
  methodId: string,
  warnings: string[],
  completed: Array<Omit<PrioritizedRow, 'rank'>> = [],
): PrioritizeResult {
  const sorted = [...scored].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.sourceIndex - b.sourceIndex
  })
  logEvent({
    level: 'info',
    module: 'feinplanung.prioritize',
    code: 'OK',
    message: `${sorted.length} Positionen priorisiert (${methodId}).`,
    context: { methodId, count: sorted.length, warnings: warnings.length, completed: completed.length },
  })
  return {
    rows: sorted.map((row, index) => ({ ...row, rank: index + 1 })),
    completedRows: completed.map((row, index) => ({ ...row, rank: index + 1 })),
    appliedRules: [],
    mapping: {},
    skippedRules: [],
    warnings,
    methodId,
  }
}

export function hoursUntilDue(dueDate: string, now: Date): number | null {
  const date = parseDate(dueDate, now)
  if (!date) return null
  return (date.getTime() - now.getTime()) / 36e5
}

export function doneRowFromOrder(order: PlanningOrder): Omit<PrioritizedRow, 'rank'> {
  return orderToPrioritizedShape(order, 0, [`Status ${order.statusF || 'erledigt'}`], {
    remainingHours: 0,
    bufferHours: null,
  })
}
