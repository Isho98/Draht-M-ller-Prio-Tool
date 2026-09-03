import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { getDataDir } from '@/lib/db/paths'
import { SEED_AREAS } from '@/lib/seed-data'
import type { DbStore } from '@/lib/db/types'
import { DEFAULT_FEINPLANUNG_SETTINGS } from '@/lib/modules/feinplanung/settings'

const DATA_DIR = getDataDir()
const STORE_PATH = path.join(DATA_DIR, 'store.json')

const DEMO_TENANT_ID = 'tenant-demo'
const DEMO_USER_ID = 'user-demo'

function getEncryptionKey(): Buffer {
  const secret = process.env.ADEPT_ENCRYPTION_KEY ?? 'adept-dev-key-change-in-production'
  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(':')
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]).toString('utf8')
}

function createDefaultStore(): DbStore {
  return {
    tenants: [{ id: DEMO_TENANT_ID, name: 'Demo GmbH' }],
    users: [
      {
        id: DEMO_USER_ID,
        tenantId: DEMO_TENANT_ID,
        email: 'demo@adept.local',
        name: 'Demo Nutzer',
        role: 'admin',
      },
    ],
    areas: SEED_AREAS,
    selections: { [DEMO_USER_ID]: [] },
    integrations: [],
    integrationSecrets: {},
    auditLogs: [],
    feinplanung: {
      ignoreMachines: [...DEFAULT_FEINPLANUNG_SETTINGS.ignoreMachines],
      customerPriorities: [],
      methodId: DEFAULT_FEINPLANUNG_SETTINGS.methodId,
      weights: { ...DEFAULT_FEINPLANUNG_SETTINGS.weights },
      weekdayCapacity: { ...DEFAULT_FEINPLANUNG_SETTINGS.weekdayCapacity },
    },
  }
}

let memoryStore: DbStore | null = null

export async function readStore(): Promise<DbStore> {
  if (memoryStore) return memoryStore

  try {
    const raw = await readFile(STORE_PATH, 'utf8')
    memoryStore = JSON.parse(raw) as DbStore
    return memoryStore
  } catch {
    const store = createDefaultStore()
    await writeStore(store)
    return store
  }
}

export async function writeStore(store: DbStore): Promise<void> {
  memoryStore = store
  try {
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
  } catch {
    // Serverless/read-only filesystem: keep the in-memory copy as source of truth.
  }
}

export function getDemoContext() {
  return { tenantId: DEMO_TENANT_ID, userId: DEMO_USER_ID }
}

export async function appendAuditLog(
  tenantId: string,
  userId: string,
  action: string,
  payload: unknown,
): Promise<void> {
  const store = await readStore()
  store.auditLogs.push({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tenantId,
    userId,
    action,
    payload,
    timestamp: new Date().toISOString(),
  })
  if (store.auditLogs.length > 500) {
    store.auditLogs = store.auditLogs.slice(-500)
  }
  await writeStore(store)
}
