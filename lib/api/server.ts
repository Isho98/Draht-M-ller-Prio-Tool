import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function createRequestId(): string {
  return randomUUID()
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data, requestId: createRequestId() }, { status })
}

export function apiError(error: unknown, requestId?: string) {
  const id = requestId ?? createRequestId()

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, requestId: id } },
      { status: error.status },
    )
  }

  console.error(`[${id}]`, error)
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ein unerwarteter Fehler ist aufgetreten.',
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
      return apiError(error, requestId)
    }
  }) as T
}
