import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import { handlers } from '../../../mocks/browser.ts'
import { resetSession, startSession } from '../../../mocks/session.ts'
import { useWebhooks } from './useWebhooks.ts'

const server = setupServer(...handlers)

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterAll(() => {
  server.close()
})

beforeEach(() => {
  resetSession()
  server.resetHandlers()
  startSession()
})

afterEach(() => {
  resetSession()
})

describe('useWebhooks', () => {
  it('starts in loading state and loads webhooks', async () => {
    const { result } = renderHook(() =>
      useWebhooks({
        page: 1,
        limit: 10,
      }),
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.data?.data).toHaveLength(10)
    expect(result.current.data?.paging.results.total).toBe(27)
  })

  it('stores ApiError when the request fails', async () => {
    server.use(
      http.get('/v1/webhooks', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    const { result } = renderHook(() =>
      useWebhooks({
        page: 1,
        limit: 10,
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error?.response.status).toBe(500)
  })

  it('reloads when params change', async () => {
    const { result, rerender } = renderHook(
      (props: { page: number; limit: number; search?: string }) =>
        useWebhooks(props),
      {
        initialProps: {
          page: 1,
          limit: 10,
        },
      },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.paging.pages.current).toBe(1)

    rerender({
      page: 2,
      limit: 10,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data?.paging.pages.current).toBe(2)
    })

    expect(result.current.data?.data).toHaveLength(10)
  })
})
