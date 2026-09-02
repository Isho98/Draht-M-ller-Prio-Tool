export type LogLevel = 'info' | 'warn' | 'error'

export type AppLogEntry = {
  timestamp: string
  level: LogLevel
  module: string
  code: string
  message: string
  context?: Record<string, unknown>
}

const MAX_BUFFER = 200
const buffer: AppLogEntry[] = []

export function logEvent(entry: Omit<AppLogEntry, 'timestamp'>): AppLogEntry {
  const full: AppLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }
  buffer.push(full)
  if (buffer.length > MAX_BUFFER) buffer.shift()

  const line = `[${full.timestamp}] ${full.module} ${full.code}: ${full.message}`
  if (full.level === 'error') console.error(line, full.context ?? '')
  else if (full.level === 'warn') console.warn(line, full.context ?? '')
  else console.info(line)

  return full
}

export function getRecentLogs(): AppLogEntry[] {
  return [...buffer]
}

export function logError(module: string, error: unknown, context?: Record<string, unknown>) {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const coded = error as { code: string; message: string }
    return logEvent({
      level: 'error',
      module,
      code: String(coded.code),
      message: String(coded.message),
      context,
    })
  }
  return logEvent({
    level: 'error',
    module,
    code: 'UNKNOWN',
    message: error instanceof Error ? error.message : 'Unbekannter Fehler',
    context: { ...context, name: error instanceof Error ? error.name : typeof error },
  })
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 2,
  delayMs = 250,
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }
  throw lastError
}
