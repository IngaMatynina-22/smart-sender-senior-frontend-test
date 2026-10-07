import { setupServer } from 'msw/node'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import { clearCsrfToken } from '../../infrastructure/api/csrf.ts'
import { handlers } from '../../mocks/browser.ts'
import { resetCsrfState } from '../../mocks/csrf.ts'
import { resetWebhooks } from '../../mocks/data.ts'
import { resetSession, startSession } from '../../mocks/session.ts'
import { getWebhook, getWebhooks, updateWebhook } from './api.ts'
import type { Webhook, WebhookList } from './model/types.ts'

const server = setupServer(...handlers)

const requested: Array<{ method: string; url: string; body: string | null }> =
  []

async function onRequestStart(event: { request: Request }) {
  const body = await event.request.clone().text()

  requested.push({
    method: event.request.method,
    url: event.request.url,
    body: body === '' ? null : body,
  })
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  server.events.on('request:start', onRequestStart)
})

afterAll(() => {
  server.events.removeListener('request:start', onRequestStart)
  server.close()
})

beforeEach(() => {
  resetSession()
  resetWebhooks()
  resetCsrfState()
  clearCsrfToken()
  server.resetHandlers()
  requested.length = 0
  startSession()
})

afterEach(() => {
  resetSession()
  resetWebhooks()
  resetCsrfState()
  clearCsrfToken()
})

describe('getWebhooks', () => {
  it('requests the first page and returns WebhookList', async () => {
    const result: WebhookList = await getWebhooks({
      page: 1,
      limit: 10,
    })

    expect(
      requested.some(
        (entry) =>
          entry.method === 'GET' &&
          entry.url.includes('/v1/webhooks?page=1&limit=10'),
      ),
    ).toBe(true)
    expect(result.data).toHaveLength(10)
    expect(result.paging).toEqual({
      pages: {
        current: 1,
        last: 3,
      },
      results: {
        total: 27,
        limitation: 10,
      },
    })
  })

  it('passes search to the request URL', async () => {
    const result: WebhookList = await getWebhooks({
      page: 1,
      limit: 10,
      search: 'payment',
    })

    expect(
      requested.some((entry) =>
        entry.url.includes('/v1/webhooks?page=1&limit=10&search=payment'),
      ),
    ).toBe(true)
    expect(result.data.map((webhook) => webhook.name)).toEqual([
      'Payment Completed',
      'Payment Failed',
      'Payment Refunded',
    ])
    expect(result.paging.results.total).toBe(3)
  })
})

describe('getWebhook', () => {
  it('requests a webhook by id and returns Webhook', async () => {
    const result: Webhook = await getWebhook(1)

    expect(
      requested.some(
        (entry) =>
          entry.method === 'GET' && entry.url.includes('/v1/webhooks/1'),
      ),
    ).toBe(true)
    expect(result).toMatchObject({
      id: 1,
      name: 'Order Created',
      url: 'https://hooks.example.com/orders/created',
    })
  })
})

describe('updateWebhook', () => {
  it('sends PUT with JSON body and returns the updated webhook', async () => {
    const result: Webhook = await updateWebhook(1, {
      name: 'Updated Order',
      url: 'https://hooks.example.com/orders/updated-path',
    })

    await expect
      .poll(() =>
        requested.find(
          (entry) =>
            entry.method === 'PUT' && entry.url.includes('/v1/webhooks/1'),
        ),
      )
      .toMatchObject({
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Order',
          url: 'https://hooks.example.com/orders/updated-path',
        }),
      })

    expect(result).toMatchObject({
      id: 1,
      name: 'Updated Order',
      url: 'https://hooks.example.com/orders/updated-path',
    })
  })
})
