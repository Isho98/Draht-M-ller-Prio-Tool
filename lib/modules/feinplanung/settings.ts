export type WeekdayCapacity = {
  mondayToThursday: number
  friday: number
  saturday: number
  sunday: number
}

export type PriorityWeights = {
  /** Default customer importance. 50 means “equal to everyone else”. */
  defaultCustomerPercent: number
  /**
   * How strongly customer % shifts ranking, expressed as hours of buffer
   * per percentage point above/below the default. Easy to retune later.
   */
  customerBufferHoursPerPercent: number
}

export type CustomerPriority = {
  id: string
  name: string
  percent: number
}

export type FeinplanungSettings = {
  ignoreMachines: string[]
  customerPriorities: CustomerPriority[]
  methodId: string
  weights: PriorityWeights
  weekdayCapacity: WeekdayCapacity
}

export const DEFAULT_IGNORE_MACHINES = ['Paletten', 'Fremdleist']

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  defaultCustomerPercent: 50,
  customerBufferHoursPerPercent: 0.4,
}

export const DEFAULT_WEEKDAY_CAPACITY: WeekdayCapacity = {
  mondayToThursday: 22.5,
  friday: 15,
  saturday: 0,
  sunday: 0,
}

export const DEFAULT_FEINPLANUNG_SETTINGS: FeinplanungSettings = {
  ignoreMachines: [...DEFAULT_IGNORE_MACHINES],
  customerPriorities: [],
  methodId: 'capacity-deadline',
  weights: { ...DEFAULT_PRIORITY_WEIGHTS },
  weekdayCapacity: { ...DEFAULT_WEEKDAY_CAPACITY },
}

export function customerPercentOf(name: string, settings: FeinplanungSettings): number {
  const key = name.trim().toLowerCase()
  if (!key) return settings.weights.defaultCustomerPercent
  const found = settings.customerPriorities.find((entry) => entry.name.trim().toLowerCase() === key)
  return found?.percent ?? settings.weights.defaultCustomerPercent
}

/** Smaller (more negative) = higher priority. */
export function effectiveBufferHours(
  buffer: number,
  customerPercent: number,
  weights: PriorityWeights,
): number {
  const delta = customerPercent - weights.defaultCustomerPercent
  return buffer - delta * weights.customerBufferHoursPerPercent
}

export function sanitizePercent(value: number): number {
  if (!Number.isFinite(value)) return 50
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10))
}

export function sanitizeIgnoreList(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }
  return result
}

export function mergeFeinplanungSettings(
  current: FeinplanungSettings,
  patch: Partial<FeinplanungSettings>,
): FeinplanungSettings {
  return {
    ...current,
    ...patch,
    ignoreMachines: sanitizeIgnoreList(patch.ignoreMachines ?? current.ignoreMachines),
    customerPriorities: (patch.customerPriorities ?? current.customerPriorities).map((entry) => ({
      ...entry,
      name: entry.name.trim(),
      percent: sanitizePercent(entry.percent),
    })),
    weights: { ...current.weights, ...patch.weights },
    weekdayCapacity: { ...current.weekdayCapacity, ...patch.weekdayCapacity },
  }
}
