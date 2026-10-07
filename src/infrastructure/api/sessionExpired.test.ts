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
  vi,
} from 'vitest'
import { getMe, issueDeviceSession, login } from '../../features/auth/api.ts'
import { handlers } from '../../mocks/browser.ts'
import { resetSession } from '../../mocks/session.ts'
import { ApiError } from './client.ts'
import {
  clearSessionExpiredNotification,
  registerSessionExpiredHandler,
} from './sessionExpired.ts'

const SESSION_TTL_MS = 30_000

const server = setupServer(...handlers)

const meStatuses: number[] = []
let rotateCount = 0

function onMockedResponse(event: {
  request: Request
  response: Response
}) {
  const path = new URL(event.request.url).pathname

  if (event.request.method === 'GET' && path === '/v1/me') {
    meStatuses.push(event.response.status)
  }

  if (event.request.method === 'POST' && path === '/auth/token/rotate') {
    rotateCount += 1
  }
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  server.events.on('response:mocked', onMockedResponse)
})

afterAll(() => {
  server.events.removeListener('response:mocked', onMockedResponse)
  server.close()
})

beforeEach(() => {
  resetSession()
  server.resetHandlers()
  localStorage.clear()
  meStatuses.length = 0
  rotateCount = 0
  clearSessionExpiredNotification()
  registerSessionExpiredHandler(null)
  vi.useFakeTimers({ toFake: ['Date'] })
})

afterEach(() => {
  registerSessionExpiredHandler(null)
  vi.useRealTimers()
})

async function createExpiredSession() {
  const baseTime = new Date('2026-01-01T00:00:00.000Z')
  vi.setSystemTime(baseTime)

  const { device_session_token } = await login(
    'test@example.com',
    'password123',
  )
  await issueDeviceSession(device_session_token)

  vi.setSystemTime(new Date(baseTime.getTime() + SESSION_TTL_MS))
}

describe('session expired after failed recovery', () => {
  it('notifies session expired when rotate returns 400', async () => {
    const onSessionExpired = vi.fn()
    registerSessionExpiredHandler(onSessionExpired)

    await createExpiredSession()

    server.use(
      http.post('/auth/token/rotate', () => {
        return new HttpResponse(null, { status: 400 })
      }),
    )

    await expect(getMe()).rejects.toBeInstanceOf(ApiError)

    expect(rotateCount).toBe(1)
    expect(meStatuses).toEqual([401])
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('notifies session expired when retry returns 401 and rotates once', async () => {
    const onSessionExpired = vi.fn()
    registerSessionExpiredHandler(onSessionExpired)

    await createExpiredSession()

    server.use(
      http.get('/v1/me', () => {
        return new HttpResponse(null, { status: 401 })
      }),
    )

    await expect(getMe()).rejects.toBeInstanceOf(ApiError)

    expect(rotateCount).toBe(1)
    expect(meStatuses.filter((status) => status === 401)).toHaveLength(2)
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('notifies session expired only once for concurrent failed rotates', async () => {
    const onSessionExpired = vi.fn()
    registerSessionExpiredHandler(onSessionExpired)

    await createExpiredSession()

    server.use(
      http.post('/auth/token/rotate', () => {
        return new HttpResponse(null, { status: 400 })
      }),
    )

    const results = await Promise.allSettled([getMe(), getMe()])

    expect(results.every((result) => result.status === 'rejected')).toBe(true)
    expect(rotateCount).toBe(1)
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })
})
