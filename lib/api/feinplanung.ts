import { ApiClientError, getUserFacingMessage } from '@/lib/api/client'
import type { PlanningOrder, PrioritizeResult } from '@/lib/modules/feinplanung/types'
import type { FeinplanungSettings } from '@/lib/modules/feinplanung/settings'

export type UploadResponse = {
  jobId: string
  fileName: string
  sheetName: string
  rowCount: number
  openCount?: number
  completedCount?: number
  columns: string[]
  doneColumns?: string[]
  result: PrioritizeResult
}

async function parseApiError(response: Response): Promise<ApiClientError> {
  try {
    const body = (await response.json()) as {
      error?: { code: string; message: string; requestId: string }
    }
    if (body.error) {
      return new ApiClientError(body.error.code, body.error.message, body.error.requestId, response.status)
    }
  } catch {
    // fall through
  }
  return new ApiClientError('REQUEST_FAILED', 'Die Anfrage konnte nicht verarbeitet werden.', undefined, response.status)
}

export async function uploadPlanningFile(file: File, options?: { methodId?: string }): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)
  if (options?.methodId) form.append('methodId', options.methodId)
  const response = await fetch('/api/v1/feinplanung/upload', {
    method: 'POST',
    body: form,
  })
  if (!response.ok) throw await parseApiError(response)
  const json = (await response.json()) as { data: UploadResponse }
  return json.data
}

export async function prioritizeJob(jobId: string, options?: { methodId?: string }): Promise<PrioritizeResult> {
  const response = await fetch('/api/v1/feinplanung/prioritize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, ...options }),
  })
  if (!response.ok) throw await parseApiError(response)
  const json = (await response.json()) as { data: PrioritizeResult }
  return json.data
}

export async function previewOrders(
  orders: PlanningOrder[],
  options?: { methodId?: string },
): Promise<{ jobId: string; fileName: string; columns: string[]; doneColumns?: string[]; result: PrioritizeResult }> {
  const response = await fetch('/api/v1/feinplanung/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders, ...options }),
  })
  if (!response.ok) throw await parseApiError(response)
  const json = (await response.json()) as {
    data: {
      jobId: string
      fileName: string
      columns: string[]
      doneColumns?: string[]
      result: PrioritizeResult
    }
  }
  return json.data
}

export async function exportJob(jobId: string): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch('/api/v1/feinplanung/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  })
  if (!response.ok) throw await parseApiError(response)
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  return { blob, filename: match?.[1] ?? 'priorisierung.xlsx' }
}

export async function getFeinplanungSettings(): Promise<FeinplanungSettings> {
  const response = await fetch('/api/v1/feinplanung/settings')
  if (!response.ok) throw await parseApiError(response)
  const json = (await response.json()) as { data: FeinplanungSettings }
  return json.data
}

export async function saveFeinplanungSettings(patch: Partial<FeinplanungSettings>): Promise<FeinplanungSettings> {
  const response = await fetch('/api/v1/feinplanung/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!response.ok) throw await parseApiError(response)
  const json = (await response.json()) as { data: FeinplanungSettings }
  return json.data
}

export { getUserFacingMessage }
