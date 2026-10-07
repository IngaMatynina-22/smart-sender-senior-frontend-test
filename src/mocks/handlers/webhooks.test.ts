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
import { getMockCsrfToken, resetCsrfState } from '../csrf.ts'
import { resetWebhooks, webhooks } from '../data.ts'
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
  resetWebhooks()
  resetCsrfState()
  server.resetHandlers()
})

afterEach(() => {
  resetSession()
  resetWebhooks()
  resetCsrfState()
})

async function getWebhooks(query = '') {
  return fetch(`/v1/webhooks${query}`)
}

async function getWebhook(id: number | string) {
  return fetch(`/v1/webhooks/${id}`)
}

async function putWebhook(
  id: number | string,
  body: { name?: string; url?: string },
) {
  return fetch(`/v1/webhooks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': getMockCsrfToken(),
    },
    body: JSON.stringify(body),
  })
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

describe('GET /v1/webhooks/:id', () => {
  it('returns an existing webhook', async () => {
    startSession()

    const response = await getWebhook(1)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(webhooks[0])
  })

  it('returns 404 for an unknown webhook', async () => {
    startSession()

    const response = await getWebhook(9999)

    expect(response.status).toBe(404)
  })

  it('returns 401 when session is inactive', async () => {
    const response = await getWebhook(1)

    expect(response.status).toBe(401)
  })
})

describe('PUT /v1/webhooks/:id', () => {
  it('updates an existing webhook', async () => {
    startSession()

    const response = await putWebhook(1, {
      name: 'Order Created Updated',
      url: 'https://hooks.example.com/orders/created-v2',
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      id: 1,
      name: 'Order Created Updated',
      url: 'https://hooks.example.com/orders/created-v2',
      active: true,
    })
  })

  it('returns 422 when name is empty', async () => {
    startSession()

    const response = await putWebhook(1, {
      name: '',
      url: 'https://hooks.example.com/orders/created',
    })
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body).toEqual({
      error: {
        type: 'ValidationException',
        message: 'The given data was invalid.',
        payload: {
          name: ['The name field is required.'],
        },
      },
    })
  })

  it('returns 422 when url is invalid', async () => {
    startSession()

    const response = await putWebhook(1, {
      name: 'Order Created',
      url: 'not-a-url',
    })
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body).toEqual({
      error: {
        type: 'ValidationException',
        message: 'The given data was invalid.',
        payload: {
          url: ['The url must be a valid URL.'],
        },
      },
    })
  })

  it('returns 422 when both fields are invalid', async () => {
    startSession()

    const response = await putWebhook(1, {
      name: '',
      url: 'ftp://example.com',
    })
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body).toEqual({
      error: {
        type: 'ValidationException',
        message: 'The given data was invalid.',
        payload: {
          name: ['The name field is required.'],
          url: ['The url must be a valid URL.'],
        },
      },
    })
  })

  it('returns 404 for an unknown webhook', async () => {
    startSession()

    const response = await putWebhook(9999, {
      name: 'Missing',
      url: 'https://hooks.example.com/missing',
    })

    expect(response.status).toBe(404)
  })

  it('returns 401 when session is inactive', async () => {
    const response = await putWebhook(1, {
      name: 'Order Created',
      url: 'https://hooks.example.com/orders/created',
    })

    expect(response.status).toBe(401)
  })

  it('persists updates for subsequent GET and list requests', async () => {
    startSession()

    const putResponse = await putWebhook(1, {
      name: 'Persisted Name',
      url: 'https://hooks.example.com/persisted',
    })

    expect(putResponse.status).toBe(200)

    const getResponse = await getWebhook(1)
    const getBody = await getResponse.json()

    expect(getBody.name).toBe('Persisted Name')
    expect(getBody.url).toBe('https://hooks.example.com/persisted')

    const listResponse = await getWebhooks('?page=1&limit=10')
    const listBody = await listResponse.json()

    expect(listBody.data[0]).toMatchObject({
      id: 1,
      name: 'Persisted Name',
      url: 'https://hooks.example.com/persisted',
    })
  })
})
