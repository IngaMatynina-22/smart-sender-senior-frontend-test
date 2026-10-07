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
import { getMe, issueDeviceSession, login } from './api.ts'
import { handlers } from '../../mocks/browser.ts'
import { resetSession } from '../../mocks/session.ts'

const SESSION_TTL_MS = 30_000

const server = setupServer(...handlers)

const meStatuses: number[] = []
let rotateCount = 0
let rotateStatus: number | null = null

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
    rotateStatus = event.response.status
  }
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
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
  rotateStatus = null
  vi.useFakeTimers({ toFake: ['Date'] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('concurrent 401 handling', () => {
  it('uses one shared rotate for two expired getMe requests', async () => {
    const baseTime = new Date('2026-01-01T00:00:00.000Z')
    vi.setSystemTime(baseTime)

    const { device_session_token } = await login(
      'test@example.com',
      'password123',
    )
    await issueDeviceSession(device_session_token)

    vi.setSystemTime(new Date(baseTime.getTime() + SESSION_TTL_MS))

    const [userA, userB] = await Promise.all([getMe(), getMe()])

    expect(rotateCount).toBe(1)
    expect(rotateStatus).toBe(200)
    expect(meStatuses.filter((status) => status === 401)).toHaveLength(2)
    expect(meStatuses.filter((status) => status === 200)).toHaveLength(2)
    expect(meStatuses).toHaveLength(4)

    expect(userA).toEqual({
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      name: 'Test User',
    })
    expect(userB).toEqual(userA)
  })
})
