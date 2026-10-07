import { http, HttpResponse } from 'msw'

const MOCK_USER = {
  email: 'test@example.com',
  password: 'password123',
}

const MOCK_DEVICE_SESSION_TOKEN = 'mock-device-session-token'

const CAPTCHA_HEADER = 'X-Captcha-Token'

type LoginBody = {
  email?: string
  password?: string
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

function invalidCredentials() {
  return HttpResponse.json(
    {
      errors: {
        password: 'Invalid credentials',
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
      return invalidCredentials()
    }

    if (body?.email !== MOCK_USER.email || body.password !== MOCK_USER.password) {
      return invalidCredentials()
    }

    return HttpResponse.json({
      device_session_token: MOCK_DEVICE_SESSION_TOKEN,
    })
  }),
]
