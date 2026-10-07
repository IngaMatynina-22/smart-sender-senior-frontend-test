import { apiClient } from '../../infrastructure/api/client.ts'
import type { Webhook, WebhookList } from './model/types.ts'

const WEBHOOKS_PATH = '/v1/webhooks'

export type GetWebhooksParams = {
  page: number
  limit: number
  search?: string
}

export type UpdateWebhookData = {
  name: string
  url: string
}

export async function getWebhooks(
  params: GetWebhooksParams,
): Promise<WebhookList> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  const search = params.search?.trim()

  if (search) {
    searchParams.set('search', search)
  }

  const response = await apiClient.get(
    `${WEBHOOKS_PATH}?${searchParams.toString()}`,
  )

  return (await response.json()) as WebhookList
}

export async function getWebhook(id: number): Promise<Webhook> {
  const response = await apiClient.get(`${WEBHOOKS_PATH}/${id}`)
  return (await response.json()) as Webhook
}

export async function updateWebhook(
  id: number,
  data: UpdateWebhookData,
): Promise<Webhook> {
  const response = await apiClient.put(`${WEBHOOKS_PATH}/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  return (await response.json()) as Webhook
}
