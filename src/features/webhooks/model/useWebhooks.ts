import { useEffect, useState } from 'react'
import { ApiError } from '../../../infrastructure/api/client.ts'
import { getWebhooks, type GetWebhooksParams } from '../api.ts'
import type { WebhookList } from './types.ts'

export type UseWebhooksResult = {
  data: WebhookList | null
  isLoading: boolean
  error: ApiError | null
}

export function useWebhooks({
  page,
  limit,
  search,
}: GetWebhooksParams): UseWebhooksResult {
  const [data, setData] = useState<WebhookList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setError(null)

    void getWebhooks({ page, limit, search })
      .then((response) => {
        if (cancelled) {
          return
        }

        setData(response)
        setError(null)
        setIsLoading(false)
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return
        }

        setError(
          caught instanceof ApiError
            ? caught
            : new ApiError(new Response(null, { status: 500 })),
        )
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, limit, search])

  return {
    data,
    isLoading,
    error,
  }
}
