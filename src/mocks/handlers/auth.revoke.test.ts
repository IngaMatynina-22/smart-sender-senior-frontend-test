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
import { getFingerprint } from '../../shared/lib/fingerprint.ts'
import { handlers } from '../browser.ts'
import { getMockCsrfToken, resetCsrfState } from '../csrf.ts'
import {
  canRotateSession,
  isSessionActive,
  resetSession,
  startSession,
} from '../session.ts'

const server = setupServer(...handlers)

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterAll(() => {
  server.close()
})

beforeEach(() => {
  resetSession()
  resetCsrfState()
  server.resetHandlers()
  localStorage.clear()
})

afterEach(() => {
  resetSession()
  resetCsrfState()
  localStorage.clear()
})

const xhrHeaders = {
  'X-Requested-With': 'XMLHttpRequest',
} as const

async function revoke(fingerprint: string) {
  return fetch('/auth/token/revoke', {
    method: 'POST',
    headers: {
      ...xhrHeaders,
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': getMockCsrfToken(),
    },
    body: JSON.stringify({ fingerprint }),
  })
}

describe('POST /auth/token/revoke', () => {
  it('ends the session when fingerprint is valid', async () => {
    const fingerprint = getFingerprint()
    startSession(fingerprint)

    const response = await revoke(fingerprint)

    expect(response.status).toBe(204)
    expect(isSessionActive()).toBe(false)
    expect(canRotateSession()).toBe(false)
  })

  it('makes /v1/me return 401 after revoke', async () => {
    const fingerprint = getFingerprint()
    startSession(fingerprint)

    await revoke(fingerprint)

    const meResponse = await fetch('/v1/me', {
      headers: xhrHeaders,
    })

    expect(meResponse.status).toBe(401)
  })

  it('makes rotate return 400 after revoke', async () => {
    const fingerprint = getFingerprint()
    startSession(fingerprint)

    await revoke(fingerprint)

    const rotateResponse = await fetch('/auth/token/rotate', {
      method: 'POST',
      headers: {
        ...xhrHeaders,
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getMockCsrfToken(),
      },
      body: JSON.stringify({ fingerprint }),
    })

    expect(rotateResponse.status).toBe(400)
  })

  it('rejects revoke when fingerprint does not match', async () => {
    startSession(getFingerprint())

    const response = await revoke('ffffffffffffffffffffffffffffffff')

    expect(response.status).toBe(422)
    expect(isSessionActive()).toBe(true)
  })
})
