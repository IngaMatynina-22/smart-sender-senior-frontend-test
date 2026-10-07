import { getFingerprint } from '../../shared/lib/fingerprint.ts'
import { getCsrfToken, refreshCsrfToken } from './csrf.ts'
import { notifySessionExpired } from './sessionExpired.ts'

export class ApiError extends Error {
  readonly response: Response

  constructor(response: Response) {
    super(`Request failed with status ${response.status}`)
    this.name = 'ApiError'
    this.response = response
  }
}

export type ApiRequestOptions = {
  headers?: HeadersInit
  body?: BodyInit | null
  skipAuthRetry?: boolean
  skipCsrfRetry?: boolean
}

type ApiGetOptions = {
  headers?: HeadersInit
  skipAuthRetry?: boolean
}

const REQUESTED_WITH_HEADER = 'X-Requested-With'
const REQUESTED_WITH_VALUE = 'XMLHttpRequest'
const CSRF_TOKEN_HEADER = 'X-CSRF-TOKEN'
const CSRF_PATH = '/csrf'
const ROTATE_SESSION_PATH = '/auth/token/rotate'

let rotatePromise: Promise<void> | null = null

function createHeaders(headers?: HeadersInit): Headers {
  const requestHeaders = new Headers(headers)
  requestHeaders.set(REQUESTED_WITH_HEADER, REQUESTED_WITH_VALUE)
  return requestHeaders
}

function shouldRetryAfterUnauthorized(
  url: string,
  status: number,
  options?: ApiRequestOptions,
): boolean {
  return (
    status === 401 &&
    !options?.skipAuthRetry &&
    url !== ROTATE_SESSION_PATH
  )
}

function shouldRetryAfterCsrfMismatch(
  url: string,
  method: string,
  status: number,
  options?: ApiRequestOptions,
): boolean {
  return (
    status === 419 &&
    (method === 'POST' || method === 'PUT') &&
    !options?.skipCsrfRetry &&
    url !== CSRF_PATH
  )
}

export async function rotateSession(): Promise<void> {
  if (!rotatePromise) {
    rotatePromise = request(ROTATE_SESSION_PATH, 'POST', {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fingerprint: getFingerprint(),
      }),
      skipAuthRetry: true,
    })
      .then(() => undefined)
      .finally(() => {
        rotatePromise = null
      })
  }

  await rotatePromise
}

async function request(
  url: string,
  method: string,
  options?: ApiRequestOptions,
): Promise<Response> {
  // Bootstrap CSRF before any other API call (TZ: GET /csrf first).
  const csrfToken = await getCsrfToken()
  const headers = createHeaders(options?.headers)

  if (method === 'POST' || method === 'PUT') {
    headers.set(CSRF_TOKEN_HEADER, csrfToken)
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options?.body,
  })

  if (response.ok) {
    return response
  }

  if (shouldRetryAfterCsrfMismatch(url, method, response.status, options)) {
    await refreshCsrfToken()

    return request(url, method, {
      ...options,
      skipCsrfRetry: true,
    })
  }

  if (shouldRetryAfterUnauthorized(url, response.status, options)) {
    try {
      await rotateSession()
    } catch (error) {
      notifySessionExpired()
      throw error
    }

    return request(url, method, {
      ...options,
      skipAuthRetry: true,
    })
  }

  if (response.status === 401 && options?.skipAuthRetry) {
    notifySessionExpired()
  }

  throw new ApiError(response)
}

export const apiClient = {
  get(url: string, options?: ApiGetOptions): Promise<Response> {
    return request(url, 'GET', options)
  },

  post(url: string, options?: ApiRequestOptions): Promise<Response> {
    return request(url, 'POST', options)
  },

  put(url: string, options?: ApiRequestOptions): Promise<Response> {
    return request(url, 'PUT', options)
  },
}
