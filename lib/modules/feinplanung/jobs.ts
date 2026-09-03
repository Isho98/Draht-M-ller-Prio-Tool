import { randomUUID } from 'crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { AppError } from '@/lib/api/server'
import { getDataDir } from '@/lib/db/paths'
import type { ParsedTable, PlanningOrder, PrioritizeResult } from './types'

const TTL_MS = 60 * 60 * 1000
const JOBS_PATH = path.join(getDataDir(), 'jobs.json')

export type PlanningJob = {
  id: string
  createdAt: number
  table: ParsedTable
  result: PrioritizeResult | null
  methodId: string
  orders: PlanningOrder[]
  completedOrders: PlanningOrder[]
}

const jobs = new Map<string, PlanningJob>()
let hydrated = false

function persistJobs() {
  try {
    mkdirSync(getDataDir(), { recursive: true })
    writeFileSync(JOBS_PATH, JSON.stringify([...jobs.values()]))
  } catch {
    // Serverless/read-only filesystem: in-memory map is enough for this instance.
  }
}

function hydrateJobs() {
  if (hydrated) return
  hydrated = true
  try {
    const raw = readFileSync(JOBS_PATH, 'utf8')
    const list = JSON.parse(raw) as PlanningJob[]
    for (const job of list) jobs.set(job.id, job)
  } catch {
    // no persisted jobs yet
  }
}

function gc() {
  hydrateJobs()
  const cutoff = Date.now() - TTL_MS
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id)
  }
}

/** Session store for imported orders. Swap for a DB-backed repository later. */
export function saveJob(
  table: ParsedTable,
  extras?: { methodId?: string; orders?: PlanningOrder[]; completedOrders?: PlanningOrder[] },
): PlanningJob {
  gc()
  const job: PlanningJob = {
    id: randomUUID(),
    createdAt: Date.now(),
    table,
    result: null,
    methodId: extras?.methodId ?? 'capacity-deadline',
    orders: extras?.orders ?? [],
    completedOrders: extras?.completedOrders ?? [],
  }
  jobs.set(job.id, job)
  persistJobs()
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

export function updateJob(
  id: string,
  patch: Partial<Pick<PlanningJob, 'result' | 'methodId' | 'orders' | 'completedOrders'>>,
): PlanningJob {
  const job = getJob(id)
  const next = { ...job, ...patch }
  jobs.set(id, next)
  persistJobs()
  return next
}
