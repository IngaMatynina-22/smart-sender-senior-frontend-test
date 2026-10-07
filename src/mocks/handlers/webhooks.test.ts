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
import { handlers } from '../browser.ts'
import { resetSession, startSession } from '../session.ts'

const server = setupServer(...handlers)

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterAll(() => {
  server.close()
})

beforeEach(() => {
  resetSession()
  server.resetHandlers()
})

afterEach(() => {
  resetSession()
})

async function getWebhooks(query = '') {
  return fetch(`/v1/webhooks${query}`)
}

describe('GET /v1/webhooks', () => {
  it('returns first page with default limit when session is active', async () => {
    startSession()

    const response = await getWebhooks()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(10)
    expect(body.paging).toEqual({
      pages: {
        current: 1,
        last: 3,
      },
      results: {
        total: 27,
        limitation: 10,
      },
    })
    expect(body.data[0].name).toBe('Order Created')
  })

  it('returns remaining items on the last page', async () => {
    startSession()

    const response = await getWebhooks('?page=3&limit=10')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(7)
    expect(body.paging.pages.current).toBe(3)
    expect(body.paging.pages.last).toBe(3)
    expect(body.paging.results.total).toBe(27)
    expect(body.paging.results.limitation).toBe(10)
  })

  it('filters by name case-insensitively before pagination', async () => {
    startSession()

    const response = await getWebhooks('?search=payment&page=1&limit=10')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.map((webhook: { name: string }) => webhook.name)).toEqual([
      'Payment Completed',
      'Payment Failed',
      'Payment Refunded',
    ])
    expect(body.paging.results.total).toBe(3)
    expect(body.paging.pages.last).toBe(1)
    expect(body.paging.results.limitation).toBe(10)
  })

  it('returns 401 when session is expired', async () => {
    const response = await getWebhooks()

    expect(response.status).toBe(401)
  })
})
