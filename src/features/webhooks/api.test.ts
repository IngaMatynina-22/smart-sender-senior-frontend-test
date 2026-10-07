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
import { handlers } from '../../mocks/browser.ts'
import { resetSession, startSession } from '../../mocks/session.ts'
import { getWebhooks } from './api.ts'
import type { WebhookList } from './model/types.ts'

const server = setupServer(...handlers)

const requestedUrls: string[] = []

function onRequestStart(event: { request: Request }) {
  requestedUrls.push(event.request.url)
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
  server.resetHandlers()
  requestedUrls.length = 0
  startSession()
})

afterEach(() => {
  resetSession()
})

describe('getWebhooks', () => {
  it('requests the first page and returns WebhookList', async () => {
    const result: WebhookList = await getWebhooks({
      page: 1,
      limit: 10,
    })

    expect(requestedUrls.some((url) => url.includes('/v1/webhooks?page=1&limit=10'))).toBe(
      true,
    )
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
      requestedUrls.some((url) =>
        url.includes('/v1/webhooks?page=1&limit=10&search=payment'),
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
