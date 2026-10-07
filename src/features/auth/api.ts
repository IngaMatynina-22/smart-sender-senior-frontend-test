import { apiClient } from '../../infrastructure/api/client.ts'
import { getFingerprint } from '../../shared/lib/fingerprint.ts'

const LOGIN_PATH = '/auth/login'
const ISSUE_SESSION_PATH = '/auth/token/issue'
const CAPTCHA_HEADER = 'X-Captcha-Token'

export type LoginResponse = {
  device_session_token: string
}

export async function login(
  email: string,
  password: string,
  captchaToken: string,
): Promise<LoginResponse> {
  const response = await apiClient.post(LOGIN_PATH, {
    headers: {
      'Content-Type': 'application/json',
      [CAPTCHA_HEADER]: captchaToken,
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
