import { apiFetch } from '@/lib/api/client'
import type { HealthStatus, Integration, IntegrationInput } from '@/lib/types'

export async function fetchHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/api/v1/health')
}

export async function fetchIntegrations(): Promise<Integration[]> {
  const data = await apiFetch<{ integrations: Integration[] }>('/api/v1/integrations')
  return data.integrations
}

export async function createIntegration(input: IntegrationInput): Promise<Integration> {
  const data = await apiFetch<{ integration: Integration }>('/api/v1/integrations', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return data.integration
}

export async function testIntegration(id: string): Promise<{
  success: boolean
  message: string
  integration: Integration
}> {
  return apiFetch(`/api/v1/integrations/${id}/test`, { method: 'POST' })
}

export async function toggleIntegration(id: string, active: boolean): Promise<Integration> {
  const data = await apiFetch<{ integration: Integration }>(`/api/v1/integrations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })
  return data.integration
}

export async function updateIntegrationMapping(
  id: string,
  mapping: Record<string, string>,
): Promise<Integration> {
  const data = await apiFetch<{ integration: Integration }>(`/api/v1/integrations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ mapping }),
  })
  return data.integration
}
