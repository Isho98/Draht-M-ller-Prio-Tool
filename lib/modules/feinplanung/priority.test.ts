import { describe, expect, it } from 'vitest'
import { matchesPrefix, matchesAnyPrefix } from './match'
import {
  DEFAULT_FEINPLANUNG_SETTINGS,
  customerPercentOf,
  isIgnoredCustomer,
  mergeFeinplanungSettings,
  normalizeWeekdayCapacity,
} from './settings'
import { machineNamesFromDisplay, matchesIgnore } from './machines'
import { hoursOnWeekday } from './calendar'
import { prioritizeOrders } from './service'
import type { PlanningOrder } from './types'

function order(partial: Partial<PlanningOrder> & Pick<PlanningOrder, 'id' | 'name' | 'customer'>): PlanningOrder {
  return {
    article: 'Artikel',
    dueDate: '10.09.2026',
    statusF: '',
    completed: false,
    machines: [{ id: `${partial.id}-m`, name: 'MG930', remainingHours: 10 }],
    extra: { offen: '10', Abruf: 'A-1' },
    sourceIndex: 0,
    ...partial,
  }
}

describe('matchesPrefix', () => {
  it('matches a 3-letter customer prefix', () => {
    expect(matchesPrefix('VDL Janssen', 'VDL')).toBe(true)
    expect(matchesPrefix('VDL Janssen', 'vdl')).toBe(true)
    expect(matchesPrefix('XYZ Industrie GmbH', 'XYZ')).toBe(true)
  })

  it('matches a longer prefix of the full name', () => {
    expect(matchesPrefix('VDL Janssen GmbH', 'VDL Janssen')).toBe(true)
  })

  it('does not match unrelated names', () => {
    expect(matchesPrefix('Helios Medical', 'VDL')).toBe(false)
    expect(matchesPrefix('Nordwerk AG', 'XYZ')).toBe(false)
  })

  it('matches machine ignore prefixes', () => {
    expect(matchesAnyPrefix('Paletten 1', ['Paletten', 'Fremdleist'])).toBe(true)
    expect(matchesIgnore('Fremdleistung', ['Fremdleist'])).toBe(true)
    expect(matchesIgnore('MG930', ['Paletten'])).toBe(false)
  })
})

describe('customerPercentOf', () => {
  it('applies 100% when only the first three letters are stored', () => {
    const settings = mergeFeinplanungSettings(DEFAULT_FEINPLANUNG_SETTINGS, {
      customerPriorities: [{ id: '1', name: 'XYZ', percent: 100 }],
    })
    expect(customerPercentOf('XYZ Industrie GmbH', settings)).toBe(100)
    expect(customerPercentOf('Nordwerk AG', settings)).toBe(50)
  })
})

describe('ignoreCustomers', () => {
  it('hides customers by prefix', () => {
    const settings = mergeFeinplanungSettings(DEFAULT_FEINPLANUNG_SETTINGS, {
      ignoreCustomers: ['VDL'],
    })
    expect(isIgnoredCustomer('VDL Janssen', settings)).toBe(true)
    expect(isIgnoredCustomer('Helios Medical', settings)).toBe(false)
  })
})

describe('prioritizeOrders settings', () => {
  it('changes table order when a customer prefix is set to 100%', () => {
    const orders = [
      order({ id: 'a', name: '110001', customer: 'Nordwerk AG', sourceIndex: 0 }),
      order({ id: 'b', name: '110002', customer: 'XYZ Industrie GmbH', sourceIndex: 1 }),
    ]

    const baseline = prioritizeOrders(orders, DEFAULT_FEINPLANUNG_SETTINGS, 'capacity-deadline')
    const boosted = prioritizeOrders(
      orders,
      mergeFeinplanungSettings(DEFAULT_FEINPLANUNG_SETTINGS, {
        customerPriorities: [{ id: 'xyz', name: 'XYZ', percent: 100 }],
      }),
      'capacity-deadline',
    )

    const baselineOrder = baseline.result.rows.map((row) => row.values.Kunde)
    const boostedOrder = boosted.result.rows.map((row) => row.values.Kunde)

    expect(boostedOrder[0]).toBe('XYZ Industrie GmbH')
    expect(boostedOrder).not.toEqual(baselineOrder)
    expect(boosted.result.rows[0].rank).toBe(1)
  })

  it('moves a 100% customer to the top even with more buffer than others', () => {
    const orders = [
      order({
        id: 'a',
        name: '110001',
        customer: 'Nordwerk AG',
        dueDate: '03.09.2026',
        machines: [{ id: 'a-m', name: 'MG950', remainingHours: 80 }],
        sourceIndex: 0,
      }),
      order({
        id: 'b',
        name: '110002',
        customer: 'XYZ Industrie GmbH',
        dueDate: '20.09.2026',
        machines: [{ id: 'b-m', name: 'MG930', remainingHours: 8 }],
        sourceIndex: 1,
      }),
    ]
    const baseline = prioritizeOrders(orders, DEFAULT_FEINPLANUNG_SETTINGS, 'capacity-deadline')
    const boosted = prioritizeOrders(
      orders,
      mergeFeinplanungSettings(DEFAULT_FEINPLANUNG_SETTINGS, {
        customerPriorities: [{ id: 'xyz', name: 'XYZ', percent: 100 }],
      }),
      'capacity-deadline',
    )
    expect(baseline.result.rows[0].values.Kunde).toBe('Nordwerk AG')
    expect(boosted.result.rows[0].values.Kunde).toBe('XYZ Industrie GmbH')
    expect(boosted.result.rows[0].rank).toBe(1)
  })

  it('removes ignored customers from the result table', () => {
    const orders = [
      order({ id: 'a', name: '110001', customer: 'VDL Janssen', sourceIndex: 0 }),
      order({ id: 'b', name: '110002', customer: 'Nordwerk AG', sourceIndex: 1 }),
    ]
    const result = prioritizeOrders(
      orders,
      mergeFeinplanungSettings(DEFAULT_FEINPLANUNG_SETTINGS, { ignoreCustomers: ['VDL'] }),
      'capacity-deadline',
    )
    expect(result.result.rows.map((row) => row.values.Kunde)).toEqual(['Nordwerk AG'])
    expect(result.open).toHaveLength(1)
  })

  it('uses editable weekday hours in the buffer calculation', () => {
    const friday = new Date(2026, 8, 4) // Friday
    const hours = hoursOnWeekday(friday, {
      monday: 22.5,
      tuesday: 22.5,
      wednesday: 22.5,
      thursday: 22.5,
      friday: 20,
      saturday: 8,
      sunday: 0,
    })
    expect(hours).toBe(20)
    expect(hoursOnWeekday(new Date(2026, 8, 5), normalizeWeekdayCapacity({ saturday: 8 }))).toBe(8)
  })
})

describe('machineNamesFromDisplay', () => {
  it('keeps machine names when hours use a German decimal comma', () => {
    expect(machineNamesFromDisplay('MG930 (6,5 Std), Safan-3 (2,5 Std), Dalex201 (4,3 Std)')).toEqual([
      'MG930',
      'Safan-3',
      'Dalex201',
    ])
  })
})
