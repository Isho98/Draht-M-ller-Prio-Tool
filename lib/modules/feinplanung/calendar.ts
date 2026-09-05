import { startOfDay as startOfDayMs } from './values'
import type { WeekdayCapacity, WeekdayId } from './settings'

function startOfDay(date: Date): Date {
  return new Date(startOfDayMs(date))
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return startOfDay(next)
}

const JS_DAY_TO_ID: WeekdayId[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export function hoursOnWeekday(date: Date, capacity: WeekdayCapacity): number {
  const id = JS_DAY_TO_ID[date.getDay()]
  const hours = capacity[id]
  return Number.isFinite(hours) ? hours : 0
}

/** Work hours from `from` through `until` (inclusive). Negative if the due date is already past. */
export function availableWorkHours(from: Date, until: Date, capacity: WeekdayCapacity): number {
  const start = startOfDay(from)
  const end = startOfDay(until)

  if (end.getTime() >= start.getTime()) {
    let hours = 0
    for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 1)) {
      hours += hoursOnWeekday(cursor, capacity)
    }
    return hours
  }

  let missed = 0
  for (let cursor = addDays(end, 1); cursor.getTime() <= start.getTime(); cursor = addDays(cursor, 1)) {
    missed += hoursOnWeekday(cursor, capacity)
  }
  return -missed
}

export function bufferHours(remainingHours: number, due: Date, now: Date, capacity: WeekdayCapacity): number {
  return availableWorkHours(now, due, capacity) - remainingHours
}

export function latestStartDate(remainingHours: number, due: Date, capacity: WeekdayCapacity): Date | null {
  if (remainingHours <= 0) return startOfDay(due)
  let leftover = remainingHours
  let cursor = startOfDay(due)
  for (let i = 0; i < 800; i++) {
    leftover -= hoursOnWeekday(cursor, capacity)
    if (leftover <= 0) return cursor
    cursor = addDays(cursor, -1)
  }
  return null
}
