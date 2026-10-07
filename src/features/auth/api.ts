import { apiClient } from '../../infrastructure/api/client.ts'
import { getFingerprint } from '../../shared/lib/fingerprint.ts'

const LOGIN_PATH = '/auth/login'
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

export async function issueDeviceSession(): Promise<void> {
  return
}

export async function getMe(): Promise<void> {
  return
}

export async function logout(): Promise<void> {
  return
}
