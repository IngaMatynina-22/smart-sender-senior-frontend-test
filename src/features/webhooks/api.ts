import { apiClient } from '../../infrastructure/api/client.ts'
import type { WebhookList } from './model/types.ts'

const WEBHOOKS_PATH = '/v1/webhooks'

export type GetWebhooksParams = {
  page: number
  limit: number
  search?: string
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
