import { http, HttpResponse } from 'msw'
import { canRotateSession, isSessionActive, startSession } from '../session.ts'

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

export const authHandlers = [
  http.post('/auth/login', async ({ request }) => {
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
    let body: IssueSessionBody

    try {
      body = (await request.json()) as IssueSessionBody
    } catch {
      return invalidDeviceSessionToken()
    }

    if (body?.device_session_token !== MOCK_DEVICE_SESSION_TOKEN) {
      return invalidDeviceSessionToken()
    }

    startSession()

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
    try {
      void ((await request.json()) as RotateSessionBody)
    } catch {}

    if (!canRotateSession()) {
      return new HttpResponse(null, { status: 400 })
    }

    startSession()

    return new HttpResponse(null, { status: 200 })
  }),
]
