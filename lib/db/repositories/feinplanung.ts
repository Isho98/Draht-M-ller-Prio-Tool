import { randomUUID } from 'crypto'
import { appendAuditLog, getDemoContext, readStore, writeStore } from '@/lib/db/store'
import {
  DEFAULT_FEINPLANUNG_SETTINGS,
  sanitizeIgnoreList,
  sanitizePercent,
  type CustomerPriority,
  type FeinplanungSettings,
} from '@/lib/modules/feinplanung/settings'

function normalize(settings: FeinplanungSettings | undefined): FeinplanungSettings {
  const base = settings ?? DEFAULT_FEINPLANUNG_SETTINGS
  return {
    ignoreMachines: sanitizeIgnoreList(base.ignoreMachines ?? DEFAULT_FEINPLANUNG_SETTINGS.ignoreMachines),
    customerPriorities: (base.customerPriorities ?? []).map((entry) => ({
      id: entry.id || randomUUID(),
      name: entry.name.trim(),
      percent: sanitizePercent(entry.percent),
    })),
    methodId: base.methodId || DEFAULT_FEINPLANUNG_SETTINGS.methodId,
    weights: {
      ...DEFAULT_FEINPLANUNG_SETTINGS.weights,
      ...base.weights,
    },
    weekdayCapacity: {
      ...DEFAULT_FEINPLANUNG_SETTINGS.weekdayCapacity,
      ...base.weekdayCapacity,
    },
  }
}

export async function getFeinplanungSettings(): Promise<FeinplanungSettings> {
  const store = await readStore()
  return normalize(store.feinplanung)
}

export async function saveFeinplanungSettings(
  patch: Partial<FeinplanungSettings>,
): Promise<FeinplanungSettings> {
  const store = await readStore()
  const current = normalize(store.feinplanung)
  const next = normalize({
    ...current,
    ...patch,
    weights: { ...current.weights, ...patch.weights },
    weekdayCapacity: { ...current.weekdayCapacity, ...patch.weekdayCapacity },
    ignoreMachines: patch.ignoreMachines ?? current.ignoreMachines,
    customerPriorities: patch.customerPriorities ?? current.customerPriorities,
  })
  store.feinplanung = next
  await writeStore(store)
  const { tenantId, userId } = getDemoContext()
  await appendAuditLog(tenantId, userId, 'feinplanung.settings.updated', {
    ignoreMachines: next.ignoreMachines,
    customers: next.customerPriorities.length,
    methodId: next.methodId,
  })
  return next
}

export async function replaceCustomerPriorities(entries: CustomerPriority[]): Promise<FeinplanungSettings> {
  return saveFeinplanungSettings({ customerPriorities: entries })
}
