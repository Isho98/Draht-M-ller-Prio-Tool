import { findPrefixMatch, matchesAnyPrefix } from './match'

export const WEEKDAYS = [
  { id: 'monday', label: 'Montag' },
  { id: 'tuesday', label: 'Dienstag' },
  { id: 'wednesday', label: 'Mittwoch' },
  { id: 'thursday', label: 'Donnerstag' },
  { id: 'friday', label: 'Freitag' },
  { id: 'saturday', label: 'Samstag' },
  { id: 'sunday', label: 'Sonntag' },
] as const

export type WeekdayId = (typeof WEEKDAYS)[number]['id']

export type WeekdayCapacity = Record<WeekdayId, number>

/** @deprecated Legacy shape kept for stored settings on disk. */
export type LegacyWeekdayCapacity = {
  mondayToThursday?: number
  friday?: number
  saturday?: number
  sunday?: number
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
  ignoreCustomers: string[]
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
  monday: 22.5,
  tuesday: 22.5,
  wednesday: 22.5,
  thursday: 22.5,
  friday: 15,
  saturday: 0,
  sunday: 0,
}

export const DEFAULT_FEINPLANUNG_SETTINGS: FeinplanungSettings = {
  ignoreMachines: [...DEFAULT_IGNORE_MACHINES],
  ignoreCustomers: [],
  customerPriorities: [],
  methodId: 'capacity-deadline',
  weights: { ...DEFAULT_PRIORITY_WEIGHTS },
  weekdayCapacity: { ...DEFAULT_WEEKDAY_CAPACITY },
}

export function sanitizeHours(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(24, Math.max(0, Math.round(value * 100) / 100))
}

export function normalizeWeekdayCapacity(raw: unknown): WeekdayCapacity {
  const defaults = { ...DEFAULT_WEEKDAY_CAPACITY }
  if (!raw || typeof raw !== 'object') return defaults
  const obj = raw as Record<string, unknown> & LegacyWeekdayCapacity

  if ('mondayToThursday' in obj && obj.mondayToThursday != null) {
    const mt = sanitizeHours(Number(obj.mondayToThursday), defaults.monday)
    return {
      monday: mt,
      tuesday: mt,
      wednesday: mt,
      thursday: mt,
      friday: sanitizeHours(Number(obj.friday), defaults.friday),
      saturday: sanitizeHours(Number(obj.saturday), defaults.saturday),
      sunday: sanitizeHours(Number(obj.sunday), defaults.sunday),
    }
  }

  return {
    monday: sanitizeHours(Number(obj.monday), defaults.monday),
    tuesday: sanitizeHours(Number(obj.tuesday), defaults.tuesday),
    wednesday: sanitizeHours(Number(obj.wednesday), defaults.wednesday),
    thursday: sanitizeHours(Number(obj.thursday), defaults.thursday),
    friday: sanitizeHours(Number(obj.friday), defaults.friday),
    saturday: sanitizeHours(Number(obj.saturday), defaults.saturday),
    sunday: sanitizeHours(Number(obj.sunday), defaults.sunday),
  }
}

export function customerPercentOf(
  name: string,
  settings: Pick<FeinplanungSettings, 'customerPriorities' | 'weights'>,
): number {
  const found = findPrefixMatch(name, settings.customerPriorities)
  return found?.percent ?? settings.weights.defaultCustomerPercent
}

export function isIgnoredCustomer(
  name: string,
  settings: Pick<FeinplanungSettings, 'ignoreCustomers'>,
): boolean {
  return matchesAnyPrefix(name, settings.ignoreCustomers ?? [])
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
    ignoreMachines: sanitizeIgnoreList(patch.ignoreMachines ?? current.ignoreMachines ?? []),
    ignoreCustomers: sanitizeIgnoreList(patch.ignoreCustomers ?? current.ignoreCustomers ?? []),
    customerPriorities: (patch.customerPriorities ?? current.customerPriorities ?? []).map((entry) => ({
      ...entry,
      name: entry.name.trim(),
      percent: sanitizePercent(entry.percent),
    })),
    weights: { ...current.weights, ...patch.weights },
    weekdayCapacity: normalizeWeekdayCapacity({
      ...current.weekdayCapacity,
      ...patch.weekdayCapacity,
    }),
  }
}
