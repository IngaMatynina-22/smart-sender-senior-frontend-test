import type { Webhook } from './types.ts'

export function useWebhooks() {
  const webhooks: Webhook[] = []

  return { webhooks }
}
