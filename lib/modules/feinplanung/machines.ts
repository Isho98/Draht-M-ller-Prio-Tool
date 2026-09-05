import { matchesAnyPrefix } from './match'
import { parseNumber } from './values'
import type { MachineHours } from './types'

export function parseMaschinenField(raw: string, orderId: string): MachineHours[] {
  if (!raw.trim()) return []

  const result: MachineHours[] = []
  const parts = raw.split(';')

  for (let index = 0; index < parts.length; index++) {
    const token = parts[index].trim()
    if (!token) continue

    const pieces = token.split(/\s+/).filter(Boolean)
    if (pieces.length === 0) continue

    const hoursToken = pieces[pieces.length - 1]
    const hours = parseNumber(hoursToken)
    const name = (hours === null ? pieces.join(' ') : pieces.slice(0, -1).join(' ')).trim()
    if (!name && hours === null) continue

    result.push({
      id: `${orderId}-m-${index}`,
      name: name || 'Maschine',
      remainingHours: hours ?? 0,
    })
  }

  return result
}

export function matchesIgnore(machineName: string, ignoreList: string[]): boolean {
  return matchesAnyPrefix(machineName, ignoreList)
}

export function relevantMachines(machines: MachineHours[], ignoreList: string[]): MachineHours[] {
  return machines.filter((machine) => !matchesIgnore(machine.name, ignoreList))
}

export function remainingHoursOf(machines: MachineHours[]): number {
  return machines.reduce((sum, machine) => sum + machine.remainingHours, 0)
}

export function formatMaschinen(machines: MachineHours[]): string {
  if (machines.length === 0) return '—'
  return machines.map((machine) => `${machine.name} ${formatHours(machine.remainingHours)}`).join('; ')
}

export function formatHoursCompact(value: number): string {
  return value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

export function formatMaschinenDisplay(machines: MachineHours[]): string {
  if (machines.length === 0) return '—'
  return machines.map((machine) => `${machine.name} (${formatHoursCompact(machine.remainingHours)} Std)`).join(', ')
}

export function formatHours(value: number): string {
  return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function machineNamesFromDisplay(value: string): string[] {
  if (!value.trim() || value.trim() === '—') return []
  return value
    .split(',')
    .map((part) => part.replace(/\s*\([^)]*\)\s*$/, '').trim())
    .filter(Boolean)
}
