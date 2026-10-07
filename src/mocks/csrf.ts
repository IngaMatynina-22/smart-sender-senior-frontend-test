import { HttpResponse } from 'msw'

const CSRF_TOKEN_HEADER = 'X-CSRF-TOKEN'
const DEFAULT_CSRF_TOKEN = 'mock-csrf-token'

let csrfToken = DEFAULT_CSRF_TOKEN
let csrfVersion = 0

export function resetCsrfState(): void {
  csrfVersion = 0
  csrfToken = DEFAULT_CSRF_TOKEN
}

export function getMockCsrfToken(): string {
  return csrfToken
}

export function rotateMockCsrfToken(): string {
  csrfVersion += 1
  csrfToken = `mock-csrf-token-${csrfVersion}`
  return csrfToken
}

export function csrfMismatchResponse() {
  return HttpResponse.json(
    {
      error: {
        type: 'TokenMismatchException',
        message: 'CSRF token mismatch.',
      },
    },
    { status: 419 },
  )
}

export function validateCsrf(request: Request) {
  const token = request.headers.get(CSRF_TOKEN_HEADER)

  if (token !== csrfToken) {
    return csrfMismatchResponse()
  }

  return null
}
