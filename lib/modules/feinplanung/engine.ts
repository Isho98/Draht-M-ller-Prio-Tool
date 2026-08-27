import type { CanonicalField, CanonicalValues, ColumnMapping, PrioritizeResult, PriorityEngine, PriorityRule } from './types'
import { CANONICAL_FIELDS } from './types'
import { parseDate, parseNumber, startOfDay, urgencyScore } from './values'

export const DEFAULT_RULES: PriorityRule[] = [
  { id: 'due-date', field: 'dueDate', type: 'date', weight: 50, label: 'Liefertermin' },
  { id: 'urgency', field: 'urgency', type: 'urgency', weight: 35, label: 'Dringlichkeit' },
  { id: 'quantity', field: 'quantity', type: 'number', weight: 5, label: 'Menge' },
  { id: 'list-order', field: 'sourceIndex', type: 'order', weight: 10, label: 'Reihenfolge' },
]

function readMapped(row: Record<string, string>, mapping: ColumnMapping, field: CanonicalField): string {
  const column = mapping[field]
  if (!column) return ''
  return row[column] ?? ''
}

function canonicalFrom(row: Record<string, string>, mapping: ColumnMapping): CanonicalValues {
  return {
    orderId: readMapped(row, mapping, 'orderId'),
    customer: readMapped(row, mapping, 'customer'),
    article: readMapped(row, mapping, 'article'),
    quantity: readMapped(row, mapping, 'quantity'),
    dueDate: readMapped(row, mapping, 'dueDate'),
    urgency: readMapped(row, mapping, 'urgency'),
    startDate: readMapped(row, mapping, 'startDate'),
    workstation: readMapped(row, mapping, 'workstation'),
  }
}

function minMax(values: Array<number | null>): (value: number | null) => number {
  const present = values.filter((v): v is number => v !== null)
  if (present.length === 0) return () => 0
  const min = Math.min(...present)
  const max = Math.max(...present)
  if (min === max) return (value) => (value === null ? 0 : 100)
  return (value) => (value === null ? 0 : ((value - min) / (max - min)) * 100)
}

function dateRaw(value: string, now: Date): number | null {
  const date = parseDate(value, now)
  if (!date) return null
  return -startOfDay(date)
}

function numberRaw(value: string): number | null {
  return parseNumber(value)
}

function orderRaw(index: number): number {
  return -index
}

function dueDateReason(value: string, now: Date): string | null {
  const date = parseDate(value, now)
  if (!date) return null
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86400000)
  if (days < 0) return `Liefertermin überschritten (${Math.abs(days)} Tage)`
  if (days === 0) return 'Liefertermin heute'
  if (days <= 3) return `Liefertermin in ${days} Tag${days === 1 ? '' : 'en'}`
  return null
}

function urgencyReason(value: string): string | null {
  const score = urgencyScore(value)
  if (score === null) return null
  if (score >= 80) return `Dringlichkeit: ${value.trim()}`
  return null
}

export function createDeadlineUrgencyEngine(rules: PriorityRule[] = DEFAULT_RULES): PriorityEngine {
  return {
    id: 'deadline-urgency-v1',
    name: 'Liefertermin, Dringlichkeit, Reihenfolge',
    prioritize({ rows, mapping, rules: overrideRules, now = new Date() }) {
      const activeRules = (overrideRules ?? rules).filter((rule) => {
        if (rule.field === 'sourceIndex') return true
        return Boolean(mapping[rule.field])
      })
      const skippedRules = (overrideRules ?? rules)
        .filter((rule) => !activeRules.some((active) => active.id === rule.id))
        .map((rule) => rule.label)

      const weightSum = activeRules.reduce((sum, rule) => sum + rule.weight, 0) || 1

      const rawByRule = activeRules.map((rule) =>
        rows.map((row, index) => {
          if (rule.type === 'order' || rule.field === 'sourceIndex') return orderRaw(index)
          const value = readMapped(row, mapping, rule.field as CanonicalField)
          if (rule.type === 'date') return dateRaw(value, now)
          if (rule.type === 'urgency') return urgencyScore(value)
          if (rule.type === 'number') return numberRaw(value)
          return null
        }),
      )

      const normalizers = rawByRule.map((column) => minMax(column))

      const scored = rows.map((row, index) => {
        const canonical = canonicalFrom(row, mapping)
        let score = 0
        const reasons: string[] = []

        activeRules.forEach((rule, ruleIndex) => {
          const raw = rawByRule[ruleIndex][index]
          const normalized = normalizers[ruleIndex](raw)
          score += (normalized * rule.weight) / weightSum
        })

        const dueReason = dueDateReason(canonical.dueDate, now)
        const urgReason = urgencyReason(canonical.urgency)
        if (dueReason) reasons.push(dueReason)
        if (urgReason) reasons.push(urgReason)
        if (reasons.length === 0) reasons.push('Standardreihenfolge')

        return {
          score: Math.round(score * 10) / 10,
          reasons,
          sourceIndex: index,
          values: row,
          canonical,
        }
      })

      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        const aDue = dateRaw(a.canonical.dueDate, now) ?? Number.NEGATIVE_INFINITY
        const bDue = dateRaw(b.canonical.dueDate, now) ?? Number.NEGATIVE_INFINITY
        if (bDue !== aDue) return bDue - aDue
        return a.sourceIndex - b.sourceIndex
      })

      const result: PrioritizeResult = {
        rows: scored.map((row, index) => ({ ...row, rank: index + 1 })),
        appliedRules: activeRules,
        mapping,
        skippedRules,
      }

      return result
    },
  }
}

export const defaultPriorityEngine = createDeadlineUrgencyEngine()
