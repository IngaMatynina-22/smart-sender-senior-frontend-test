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
}

type ApiGetOptions = {
  headers?: HeadersInit
}

const REQUESTED_WITH_HEADER = 'X-Requested-With'
const REQUESTED_WITH_VALUE = 'XMLHttpRequest'

function createHeaders(headers?: HeadersInit): Headers {
  const requestHeaders = new Headers(headers)
  requestHeaders.set(REQUESTED_WITH_HEADER, REQUESTED_WITH_VALUE)
  return requestHeaders
}

async function request(
  url: string,
  method: string,
  options?: ApiRequestOptions,
): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: createHeaders(options?.headers),
    body: options?.body,
  })

  if (!response.ok) {
    throw new ApiError(response)
  }

  return response
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
