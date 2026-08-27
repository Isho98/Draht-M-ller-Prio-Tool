import type { ApiErrorBody } from '@/lib/types'

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public requestId?: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

const DEFAULT_TIMEOUT_MS = 10_000
const MAX_RETRIES = 3
const RETRY_BASE_MS = 500

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(status: number | undefined, error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return false
  if (status === undefined) return true
  return status >= 500
}

async function parseError(response: Response): Promise<ApiClientError> {
  try {
    const body = (await response.json()) as ApiErrorBody
    if (body.error) {
      return new ApiClientError(
        body.error.code,
        body.error.message,
        body.error.requestId,
        response.status,
      )
    }
  } catch {
    // fall through
  }
  return new ApiClientError(
    'REQUEST_FAILED',
    'Die Anfrage konnte nicht verarbeitet werden.',
    undefined,
    response.status,
  )
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    try {
      const response = await fetch(path, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const error = await parseError(response)
        if (isRetryable(response.status, error) && attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_BASE_MS * 2 ** attempt)
          continue
        }
        throw error
      }

      const json = (await response.json()) as { data: T }
      return json.data
    } catch (error) {
      if (error instanceof ApiClientError) throw error
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_BASE_MS * 2 ** attempt)
        continue
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new ApiClientError(
    'NETWORK_ERROR',
    'Verbindung zum Server fehlgeschlagen. Bitte später erneut versuchen.',
    undefined,
    undefined,
  )
}

export function getUserFacingMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message
  return 'Ein unerwarteter Fehler ist aufgetreten.'
}
