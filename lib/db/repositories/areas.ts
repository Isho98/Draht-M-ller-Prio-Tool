import { readStore } from '@/lib/db/store'
import type { Area } from '@/lib/types'

export async function getAreas(): Promise<Area[]> {
  const store = await readStore()
  return store.areas
}

export async function getAreaById(areaId: string): Promise<Area | undefined> {
  const store = await readStore()
  return store.areas.find((a) => a.id === areaId)
}

export async function getFunctionLabel(functionId: string): Promise<string | undefined> {
  const store = await readStore()
  for (const area of store.areas) {
    const fn = area.functions.find((f) => f.id === functionId)
    if (fn) return fn.label
  }
  return undefined
}

export async function getFunctionArea(functionId: string): Promise<{
  area: Area
  function: { id: string; label: string }
} | null> {
  const store = await readStore()
  for (const area of store.areas) {
    const fn = area.functions.find((f) => f.id === functionId)
    if (fn) return { area, function: fn }
  }
  return null
}
