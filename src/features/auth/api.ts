import { apiClient } from '../../infrastructure/api/client.ts'
import { rotateSession as rotateSessionRequest } from '../../infrastructure/api/session.ts'
import { getFingerprint } from '../../shared/lib/fingerprint.ts'
import type { User } from './model/types.ts'

const LOGIN_PATH = '/auth/login'
const ISSUE_SESSION_PATH = '/auth/token/issue'
const ME_PATH = '/v1/me'
const CAPTCHA_HEADER = 'X-Captcha-Token'
const MOCK_CAPTCHA_TOKEN = 'mock-captcha-token'

export type LoginResponse = {
  device_session_token: string
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await apiClient.post(LOGIN_PATH, {
    headers: {
      'Content-Type': 'application/json',
      [CAPTCHA_HEADER]: MOCK_CAPTCHA_TOKEN,
    },
    body: JSON.stringify({
      email,
      password,
      fingerprint: getFingerprint(),
    }),
  })

  return (await response.json()) as LoginResponse
}

export async function issueDeviceSession(deviceSessionToken: string): Promise<void> {
  await apiClient.post(ISSUE_SESSION_PATH, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device_session_token: deviceSessionToken,
      fingerprint: getFingerprint(),
    }),
  })
}

export async function getMe(): Promise<User> {
  const response = await apiClient.get(ME_PATH)
  return (await response.json()) as User
}

export async function rotateSession(): Promise<void> {
  await rotateSessionRequest()
}
