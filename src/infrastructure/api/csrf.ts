const CSRF_PATH = '/csrf'
const CSRF_TOKEN_HEADER = 'X-CSRF-TOKEN'
const REQUESTED_WITH_HEADER = 'X-Requested-With'
const REQUESTED_WITH_VALUE = 'XMLHttpRequest'

let csrfToken: string | null = null
let csrfPromise: Promise<string> | null = null
let csrfGeneration = 0

export function clearCsrfToken(): void {
  csrfToken = null
  csrfPromise = null
  csrfGeneration += 1
}

export async function getCsrfToken(): Promise<string> {
  if (csrfToken !== null) {
    return csrfToken
  }

  return refreshCsrfToken()
}

export async function refreshCsrfToken(): Promise<string> {
  if (!csrfPromise) {
    const generation = csrfGeneration

    csrfPromise = fetchCsrfToken(generation).finally(() => {
      csrfPromise = null
    })
  }

  return csrfPromise
}

async function fetchCsrfToken(generation: number): Promise<string> {
  const headers = new Headers()
  headers.set(REQUESTED_WITH_HEADER, REQUESTED_WITH_VALUE)

  const response = await fetch(CSRF_PATH, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(`CSRF request failed with status ${response.status}`)
  }

  const token = response.headers.get(CSRF_TOKEN_HEADER)

  if (!token) {
    throw new Error('CSRF token header is missing')
  }

  if (generation === csrfGeneration) {
    csrfToken = token
  }

  return token
}
