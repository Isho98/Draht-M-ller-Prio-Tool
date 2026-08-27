import { randomUUID } from 'crypto'
import {
  appendAuditLog,
  decryptSecret,
  encryptSecret,
  readStore,
  writeStore,
} from '@/lib/db/store'
import type { Integration, IntegrationInput, IntegrationStatus } from '@/lib/types'

export async function listIntegrations(tenantId: string): Promise<Integration[]> {
  const store = await readStore()
  return store.integrations.filter((i) => i.tenantId === tenantId)
}

export async function getIntegration(
  tenantId: string,
  integrationId: string,
): Promise<Integration | undefined> {
  const store = await readStore()
  return store.integrations.find((i) => i.tenantId === tenantId && i.id === integrationId)
}

export async function createIntegration(
  tenantId: string,
  userId: string,
  input: IntegrationInput,
): Promise<Integration> {
  const store = await readStore()
  const now = new Date().toISOString()
  const id = randomUUID()

  const integration: Integration = {
    id,
    tenantId,
    name: input.name,
    type: input.type,
    serverUrl: input.serverUrl,
    status: 'inactive',
    lastTestedAt: null,
    lastTestMessage: null,
    mapping: input.mapping ?? {},
    createdAt: now,
    updatedAt: now,
  }

  store.integrations.push(integration)

  const secrets: { username?: string; password?: string; token?: string } = {}
  if (input.username) secrets.username = encryptSecret(input.username)
  if (input.password) secrets.password = encryptSecret(input.password)
  if (input.token) secrets.token = encryptSecret(input.token)
  store.integrationSecrets[id] = secrets

  await writeStore(store)
  await appendAuditLog(tenantId, userId, 'integration.created', { integrationId: id, name: input.name })
  return integration
}

export async function updateIntegrationStatus(
  tenantId: string,
  integrationId: string,
  status: IntegrationStatus,
  message: string | null,
): Promise<Integration | null> {
  const store = await readStore()
  const integration = store.integrations.find(
    (i) => i.tenantId === tenantId && i.id === integrationId,
  )
  if (!integration) return null

  integration.status = status
  integration.lastTestedAt = new Date().toISOString()
  integration.lastTestMessage = message
  integration.updatedAt = new Date().toISOString()
  await writeStore(store)
  return integration
}

export async function setIntegrationActive(
  tenantId: string,
  userId: string,
  integrationId: string,
  active: boolean,
): Promise<Integration | null> {
  const integration = await getIntegration(tenantId, integrationId)
  if (!integration) return null
  return updateIntegrationStatus(
    tenantId,
    integrationId,
    active ? 'active' : 'inactive',
    active ? 'Manuell aktiviert' : 'Manuell deaktiviert',
  ).then(async (updated) => {
    if (updated) {
      await appendAuditLog(tenantId, userId, 'integration.toggled', {
        integrationId,
        active,
      })
    }
    return updated
  })
}

export async function testIntegrationConnection(
  tenantId: string,
  userId: string,
  integrationId: string,
): Promise<{ success: boolean; message: string; integration: Integration | null }> {
  const store = await readStore()
  const integration = store.integrations.find(
    (i) => i.tenantId === tenantId && i.id === integrationId,
  )
  if (!integration) {
    return { success: false, message: 'Anbindung nicht gefunden.', integration: null }
  }

  const secrets = store.integrationSecrets[integrationId]
  if (!secrets?.password && !secrets?.token) {
    const updated = await updateIntegrationStatus(
      tenantId,
      integrationId,
      'error',
      'Keine Zugangsdaten hinterlegt.',
    )
    return { success: false, message: 'Keine Zugangsdaten hinterlegt.', integration: updated }
  }

  try {
    if (secrets.password) decryptSecret(secrets.password)
    if (secrets.token) decryptSecret(secrets.token)
    if (secrets.username) decryptSecret(secrets.username)
  } catch {
    const updated = await updateIntegrationStatus(
      tenantId,
      integrationId,
      'error',
      'Zugangsdaten konnten nicht gelesen werden.',
    )
    return {
      success: false,
      message: 'Zugangsdaten konnten nicht gelesen werden.',
      integration: updated,
    }
  }

  const reachable = integration.serverUrl.startsWith('http')
  const message = reachable
    ? 'Verbindung erfolgreich getestet.'
    : 'Server-Adresse ist ungültig. Bitte prüfen Sie die URL.'

  const updated = await updateIntegrationStatus(
    tenantId,
    integrationId,
    reachable ? 'active' : 'error',
    message,
  )
  await appendAuditLog(tenantId, userId, 'integration.tested', {
    integrationId,
    success: reachable,
  })

  return { success: reachable, message, integration: updated }
}

export async function updateIntegrationMapping(
  tenantId: string,
  userId: string,
  integrationId: string,
  mapping: Record<string, string>,
): Promise<Integration | null> {
  const store = await readStore()
  const integration = store.integrations.find(
    (i) => i.tenantId === tenantId && i.id === integrationId,
  )
  if (!integration) return null

  integration.mapping = mapping
  integration.updatedAt = new Date().toISOString()
  await writeStore(store)
  await appendAuditLog(tenantId, userId, 'integration.mapping.updated', { integrationId })
  return integration
}
