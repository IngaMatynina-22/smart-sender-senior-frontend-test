import { getFingerprint } from '../../shared/lib/fingerprint.ts'
import { apiClient } from './client.ts'

const ROTATE_SESSION_PATH = '/auth/token/rotate'

export async function rotateSession(): Promise<void> {
  await apiClient.post(ROTATE_SESSION_PATH, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fingerprint: getFingerprint(),
    }),
    skipAuthRetry: true,
  })
}
