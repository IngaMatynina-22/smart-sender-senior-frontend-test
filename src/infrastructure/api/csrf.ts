import { apiClient } from './client.ts'

const CSRF_PATH = '/csrf'
const CSRF_TOKEN_HEADER = 'X-CSRF-TOKEN'

let csrfToken: string | null = null

export async function getCsrfToken(): Promise<string> {
  if (csrfToken !== null) {
    return csrfToken
  }

  return refreshCsrfToken()
}

export async function refreshCsrfToken(): Promise<string> {
  const response = await apiClient.get(CSRF_PATH)
  const token = response.headers.get(CSRF_TOKEN_HEADER)

  if (!token) {
    throw new Error('CSRF token header is missing')
  }

  csrfToken = token
  return token
}
