import { randomUUID } from 'crypto'
import { AppError } from '@/lib/api/server'
import type { ColumnMapping, ParsedTable, PrioritizeResult } from './types'

const TTL_MS = 60 * 60 * 1000

export type PlanningJob = {
  id: string
  createdAt: number
  table: ParsedTable
  suggestedMapping: ColumnMapping
  mapping: ColumnMapping
  result: PrioritizeResult | null
}

const jobs = new Map<string, PlanningJob>()

function gc() {
  const cutoff = Date.now() - TTL_MS
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id)
  }
}

export function saveJob(table: ParsedTable, suggestedMapping: ColumnMapping): PlanningJob {
  gc()
  const job: PlanningJob = {
    id: randomUUID(),
    createdAt: Date.now(),
    table,
    suggestedMapping,
    mapping: suggestedMapping,
    result: null,
  }
  jobs.set(job.id, job)
  return job
}

export function getJob(id: string): PlanningJob {
  gc()
  const job = jobs.get(id)
  if (!job) {
    throw new AppError(
      'JOB_NOT_FOUND',
      'Die Sitzung ist abgelaufen. Bitte die Excel-Datei erneut hochladen.',
      404,
    )
  }
  return job
}

export function updateJob(id: string, patch: Partial<Pick<PlanningJob, 'mapping' | 'result'>>): PlanningJob {
  const job = getJob(id)
  const next = { ...job, ...patch }
  jobs.set(id, next)
  return next
}
