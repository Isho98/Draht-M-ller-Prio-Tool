import { randomUUID } from 'crypto'
import { appendAuditLog, getDemoContext, readStore, writeStore } from '@/lib/db/store'
import {
  DEFAULT_FEINPLANUNG_SETTINGS,
  mergeFeinplanungSettings,
  type CustomerPriority,
  type FeinplanungSettings,
} from '@/lib/modules/feinplanung/settings'

function normalize(settings: FeinplanungSettings | undefined): FeinplanungSettings {
  const merged = mergeFeinplanungSettings(DEFAULT_FEINPLANUNG_SETTINGS, settings ?? {})
  return {
    ...merged,
    customerPriorities: merged.customerPriorities.map((entry) => ({
      ...entry,
      id: entry.id || randomUUID(),
    })),
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
  const next = normalize(mergeFeinplanungSettings(current, patch))
  store.feinplanung = next
  await writeStore(store)
  const { tenantId, userId } = getDemoContext()
  await appendAuditLog(tenantId, userId, 'feinplanung.settings.updated', {
    ignoreMachines: next.ignoreMachines,
    ignoreCustomers: next.ignoreCustomers,
    customers: next.customerPriorities.length,
    methodId: next.methodId,
  })
  return next
}

export async function replaceCustomerPriorities(entries: CustomerPriority[]): Promise<FeinplanungSettings> {
  return saveFeinplanungSettings({ customerPriorities: entries })
}
