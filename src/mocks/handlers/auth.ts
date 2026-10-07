import { http, HttpResponse } from 'msw'
import { isValidFingerprint } from '../../shared/lib/fingerprint.ts'
import { validateCsrf } from '../csrf.ts'
import {
  authenticationErrorResponse,
  badRequestResponse,
  validationErrorResponse,
} from '../errors.ts'
import { validateRequestedWith } from '../requestedWith.ts'
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
  return validationErrorResponse({
    captcha: ['The captcha field is required.'],
  })
}

function invalidBody() {
  return validationErrorResponse({
    body: ['The given data was invalid.'],
  })
}

function unknownEmail() {
  return validationErrorResponse({
    email: ['Invalid credentials.'],
  })
}

function invalidPassword() {
  return validationErrorResponse({
    password: ['Invalid credentials.'],
  })
}

function invalidDeviceSessionToken() {
  return validationErrorResponse({
    device_session_token: ['Invalid device session token.'],
  })
}

function invalidFingerprint() {
  return validationErrorResponse({
    fingerprint: ['Invalid fingerprint.'],
  })
}

function readFingerprint(value: unknown): string | null {
  if (typeof value !== 'string' || !isValidFingerprint(value)) {
    return null
  }

  return value
}

export const authHandlers = [
  http.post('/auth/login', async ({ request }) => {
    const requestedWithError = validateRequestedWith(request)

    if (requestedWithError) {
      return requestedWithError
    }

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

    if (readFingerprint(body.fingerprint) === null) {
      return invalidFingerprint()
    }

    if (body.email !== MOCK_USER.email) {
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
    const requestedWithError = validateRequestedWith(request)

    if (requestedWithError) {
      return requestedWithError
    }

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

    if (body.device_session_token !== MOCK_DEVICE_SESSION_TOKEN) {
      return invalidDeviceSessionToken()
    }

    const fingerprint = readFingerprint(body.fingerprint)

    if (fingerprint === null) {
      return invalidFingerprint()
    }

    startSession(fingerprint)

    return new HttpResponse(null, { status: 200 })
  }),

  http.get('/v1/me', ({ request }) => {
    const requestedWithError = validateRequestedWith(request)

    if (requestedWithError) {
      return requestedWithError
    }

    if (!isSessionActive()) {
      return authenticationErrorResponse()
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
    const requestedWithError = validateRequestedWith(request)

    if (requestedWithError) {
      return requestedWithError
    }

    const csrfError = validateCsrf(request)

    if (csrfError) {
      return csrfError
    }

    let body: RotateSessionBody

    try {
      body = (await request.json()) as RotateSessionBody
    } catch {
      return badRequestResponse('Invalid rotate request.')
    }

    const fingerprint = readFingerprint(body.fingerprint)

    if (fingerprint === null || fingerprint !== getSessionFingerprint()) {
      return badRequestResponse('Unable to rotate session.')
    }

    if (!canRotateSession()) {
      return badRequestResponse('Unable to rotate session.')
    }

    startSession(fingerprint)

    return new HttpResponse(null, { status: 200 })
  }),

  http.post('/auth/token/revoke', async ({ request }) => {
    const requestedWithError = validateRequestedWith(request)

    if (requestedWithError) {
      return requestedWithError
    }

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

    const fingerprint = readFingerprint(body.fingerprint)

    if (fingerprint === null || fingerprint !== getSessionFingerprint()) {
      return invalidFingerprint()
    }

    endSession()

    return new HttpResponse(null, { status: 204 })
  }),
]
