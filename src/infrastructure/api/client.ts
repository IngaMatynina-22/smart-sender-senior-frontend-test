import { getCsrfToken } from './csrf.ts'

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
}

type ApiGetOptions = {
  headers?: HeadersInit
  skipAuthRetry?: boolean
}

const REQUESTED_WITH_HEADER = 'X-Requested-With'
const REQUESTED_WITH_VALUE = 'XMLHttpRequest'
const CSRF_TOKEN_HEADER = 'X-CSRF-TOKEN'
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

async function rotateSharedSession(): Promise<void> {
  if (!rotatePromise) {
    rotatePromise = import('./session.ts')
      .then(({ rotateSession }) => rotateSession())
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
  const headers = createHeaders(options?.headers)

  if (method === 'POST' || method === 'PUT') {
    headers.set(CSRF_TOKEN_HEADER, await getCsrfToken())
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options?.body,
  })

  if (response.ok) {
    return response
  }

  if (shouldRetryAfterUnauthorized(url, response.status, options)) {
    await rotateSharedSession()

    return request(url, method, {
      ...options,
      skipAuthRetry: true,
    })
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
