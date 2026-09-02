import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { AppError } from '@/lib/errors'
import { logError, logEvent } from '@/lib/logging'

export { AppError }

export function createRequestId(): string {
  return randomUUID()
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data, requestId: createRequestId() }, { status })
}

export function apiError(error: unknown, requestId?: string) {
  const id = requestId ?? createRequestId()
  logError('api', error, { requestId: id })

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, requestId: id } },
      { status: error.status },
    )
  }

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte erneut versuchen. Die App bleibt bedienbar.',
        requestId: id,
      },
    },
    { status: 500 },
  )
}

export function withErrorHandling<T extends (...args: never[]) => Promise<Response>>(
  handler: T,
): T {
  return (async (...args: Parameters<T>) => {
    const requestId = createRequestId()
    try {
      return await handler(...args)
    } catch (error) {
      logEvent({
        level: 'error',
        module: 'api.handler',
        code: error instanceof AppError ? error.code : 'UNCAUGHT',
        message: error instanceof AppError ? error.message : 'Unabgefangener Fehler im API-Handler.',
        context: { requestId },
      })
      return apiError(error, requestId)
    }
  }) as T
}
