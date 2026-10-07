export type Webhook = {
  id: number
  name: string
  url: string
  active: boolean
  created_at: string
}

export type WebhookList = {
  data: Webhook[]
  paging: {
    pages: {
      current: number
      last: number
    }
    results: {
      total: number
      limitation: number
    }
  }
}
