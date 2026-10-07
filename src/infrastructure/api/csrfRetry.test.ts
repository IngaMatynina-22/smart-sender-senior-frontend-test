import { http, HttpResponse } from 'msw'
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
import {
  getMockCsrfToken,
  resetCsrfState,
  rotateMockCsrfToken,
} from '../../mocks/csrf.ts'
import { resetWebhooks } from '../../mocks/data.ts'
import { resetSession, startSession } from '../../mocks/session.ts'
import { ApiError, apiClient } from './client.ts'
import { clearCsrfToken, getCsrfToken } from './csrf.ts'

const server = setupServer(...handlers)

const requested: Array<{ method: string; path: string; csrf: string | null }> =
  []

function onRequestStart(event: { request: Request }) {
  const url = new URL(event.request.url)

  requested.push({
    method: event.request.method,
    path: url.pathname,
    csrf: event.request.headers.get('X-CSRF-TOKEN'),
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
  startSession('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
})

afterEach(() => {
  resetSession()
  resetWebhooks()
  resetCsrfState()
  clearCsrfToken()
})

describe('CSRF 419 retry', () => {
  it('refreshes CSRF and retries PUT once after 419', async () => {
    await getCsrfToken()
    rotateMockCsrfToken()

    const response = await apiClient.put('/v1/webhooks/1', {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Order Created',
        url: 'https://hooks.example.com/orders/created',
      }),
    })

    expect(response.status).toBe(200)
    expect(
      requested.filter((entry) => entry.path === '/v1/webhooks/1').length,
    ).toBe(2)
    expect(requested.some((entry) => entry.path === '/csrf')).toBe(true)
    expect(
      requested
        .filter((entry) => entry.path === '/v1/webhooks/1')
        .at(-1)?.csrf,
    ).toBe(getMockCsrfToken())
  })

  it('returns 419 when retry also fails with 419', async () => {
    server.use(
      http.put('/v1/webhooks/:id', () => {
        return HttpResponse.json(
          {
            error: {
              type: 'TokenMismatchException',
              message: 'CSRF token mismatch.',
            },
          },
          { status: 419 },
        )
      }),
    )

    await expect(
      apiClient.put('/v1/webhooks/1', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Order Created',
          url: 'https://hooks.example.com/orders/created',
        }),
      }),
    ).rejects.toSatisfy((error: unknown) => {
      return error instanceof ApiError && error.response.status === 419
    })

    expect(
      requested.filter((entry) => entry.path === '/v1/webhooks/1').length,
    ).toBe(2)
    expect(requested.filter((entry) => entry.path === '/csrf').length).toBe(
      2,
    )
  })

  it('bootstraps CSRF before GET and does not attach the token to GET', async () => {
    await apiClient.get('/v1/webhooks?page=1&limit=10')

    const csrfIndex = requested.findIndex(
      (entry) => entry.method === 'GET' && entry.path === '/csrf',
    )
    const getIndex = requested.findIndex(
      (entry) =>
        entry.method === 'GET' && entry.path === '/v1/webhooks',
    )

    expect(csrfIndex).toBeGreaterThanOrEqual(0)
    expect(getIndex).toBeGreaterThan(csrfIndex)
    expect(requested[getIndex]?.csrf).toBeNull()
  })

  it('does not run CSRF retry for /csrf itself', async () => {
    server.use(
      http.get('/csrf', () => {
        return HttpResponse.json(
          {
            error: {
              type: 'TokenMismatchException',
              message: 'CSRF token mismatch.',
            },
          },
          { status: 419 },
        )
      }),
    )

    await expect(getCsrfToken()).rejects.toThrow(
      'CSRF request failed with status 419',
    )

    expect(requested.filter((entry) => entry.path === '/csrf').length).toBe(1)
  })
})
