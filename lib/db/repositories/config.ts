import { appendAuditLog, readStore, writeStore } from '@/lib/db/store'
import { getAreas } from '@/lib/db/repositories/areas'

export async function getSelection(userId: string): Promise<string[]> {
  const store = await readStore()
  return store.selections[userId] ?? []
}

export async function setSelection(
  tenantId: string,
  userId: string,
  functionIds: string[],
): Promise<string[]> {
  const areas = await getAreas()
  const validIds = new Set(areas.flatMap((a) => a.functions.map((f) => f.id)))
  const filtered = functionIds.filter((id) => validIds.has(id))

  const store = await readStore()
  store.selections[userId] = filtered
  await writeStore(store)
  await appendAuditLog(tenantId, userId, 'config.selection.updated', { functionIds: filtered })
  return filtered
}

export async function toggleSelection(
  tenantId: string,
  userId: string,
  functionId: string,
): Promise<string[]> {
  const current = await getSelection(userId)
  const next = current.includes(functionId)
    ? current.filter((id) => id !== functionId)
    : [...current, functionId]
  return setSelection(tenantId, userId, next)
}
