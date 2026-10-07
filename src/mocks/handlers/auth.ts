import { http, HttpResponse } from 'msw'
import { validateCsrf } from '../csrf.ts'
import {
  canRotateSession,
  endSession,
  getSessionFingerprint,
  isSessionActive,
  startSession,
} from '../session.ts'

const MOCK_USER = {
  id: 1,
  email: 'test@example.com',
  password: 'password123',
  first_name: 'Test',
  last_name: 'User',
  name: 'Test User',
}

const MOCK_DEVICE_SESSION_TOKEN = 'mock-device-session-token'

const CAPTCHA_HEADER = 'X-Captcha-Token'

type LoginBody = {
  email?: string
  password?: string
  fingerprint?: string
}

type IssueSessionBody = {
  device_session_token?: string
  fingerprint?: string
}

type RotateSessionBody = {
  fingerprint?: string
}

type RevokeSessionBody = {
  fingerprint?: string
}

function captchaRequired() {
  return HttpResponse.json(
    {
      errors: {
        captcha: 'Captcha token is required',
      },
    },
    { status: 422 },
  )
}

function invalidBody() {
  return HttpResponse.json(
    {
      errors: {
        body: 'Invalid request body',
      },
    },
    { status: 422 },
  )
}

function unknownEmail() {
  return HttpResponse.json(
    {
      errors: {
        email: 'Invalid credentials',
      },
    },
    { status: 422 },
  )
}

function invalidPassword() {
  return HttpResponse.json(
    {
      errors: {
        password: 'Invalid credentials',
      },
    },
    { status: 422 },
  )
}

function invalidDeviceSessionToken() {
  return HttpResponse.json(
    {
      errors: {
        device_session_token: 'Invalid device session token',
      },
    },
    { status: 422 },
  )
}

function invalidFingerprint() {
  return HttpResponse.json(
    {
      errors: {
        fingerprint: 'Invalid fingerprint',
      },
    },
    { status: 422 },
  )
}

export const authHandlers = [
  http.post('/auth/login', async ({ request }) => {
    const csrfError = validateCsrf(request)

    if (csrfError) {
      return csrfError
    }

    const captchaToken = request.headers.get(CAPTCHA_HEADER)

    if (captchaToken === null || captchaToken.trim() === '') {
      return captchaRequired()
    }

    let body: LoginBody

    try {
      body = (await request.json()) as LoginBody
    } catch {
      return invalidBody()
    }

    if (body?.email !== MOCK_USER.email) {
      return unknownEmail()
    }

    if (body.password !== MOCK_USER.password) {
      return invalidPassword()
    }

    return HttpResponse.json({
      device_session_token: MOCK_DEVICE_SESSION_TOKEN,
    })
  }),

  http.post('/auth/token/issue', async ({ request }) => {
    const csrfError = validateCsrf(request)

    if (csrfError) {
      return csrfError
    }

    let body: IssueSessionBody

    try {
      body = (await request.json()) as IssueSessionBody
    } catch {
      return invalidDeviceSessionToken()
    }

    if (body?.device_session_token !== MOCK_DEVICE_SESSION_TOKEN) {
      return invalidDeviceSessionToken()
    }

    if (typeof body.fingerprint !== 'string' || body.fingerprint.trim() === '') {
      return invalidFingerprint()
    }

    startSession(body.fingerprint)

    return new HttpResponse(null, { status: 200 })
  }),

  http.get('/v1/me', () => {
    if (!isSessionActive()) {
      return new HttpResponse(null, { status: 401 })
    }

    return HttpResponse.json({
      id: MOCK_USER.id,
      email: MOCK_USER.email,
      first_name: MOCK_USER.first_name,
      last_name: MOCK_USER.last_name,
      name: MOCK_USER.name,
    })
  }),

  http.post('/auth/token/rotate', async ({ request }) => {
    const csrfError = validateCsrf(request)

    if (csrfError) {
      return csrfError
    }

    try {
      void ((await request.json()) as RotateSessionBody)
    } catch {}

    if (!canRotateSession()) {
      return new HttpResponse(null, { status: 400 })
    }

    startSession()

    return new HttpResponse(null, { status: 200 })
  }),

  http.post('/auth/token/revoke', async ({ request }) => {
    const csrfError = validateCsrf(request)

    if (csrfError) {
      return csrfError
    }

    let body: RevokeSessionBody

    try {
      body = (await request.json()) as RevokeSessionBody
    } catch {
      return invalidFingerprint()
    }

    if (
      typeof body.fingerprint !== 'string' ||
      body.fingerprint.trim() === '' ||
      body.fingerprint !== getSessionFingerprint()
    ) {
      return invalidFingerprint()
    }

    endSession()

    return new HttpResponse(null, { status: 200 })
  }),
]
