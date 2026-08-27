import { apiFetch } from '@/lib/api/client'
import type { Area } from '@/lib/types'

export async function fetchAreas(): Promise<Area[]> {
  const data = await apiFetch<{ areas: Area[] }>('/api/v1/areas')
  return data.areas
}

export async function fetchSelection(): Promise<string[]> {
  const data = await apiFetch<{ functionIds: string[] }>('/api/v1/config/selection')
  return data.functionIds
}

export async function saveSelection(functionIds: string[]): Promise<string[]> {
  const data = await apiFetch<{ functionIds: string[] }>('/api/v1/config/selection', {
    method: 'PUT',
    body: JSON.stringify({ functionIds }),
  })
  return data.functionIds
}
