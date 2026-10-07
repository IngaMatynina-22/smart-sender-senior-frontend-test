import { useEffect, useState } from 'react'
import { ApiError } from '../../../infrastructure/api/client.ts'
import { getWebhooks, type GetWebhooksParams } from '../api.ts'
import type { WebhookList } from './types.ts'

export type WebhooksQuery = {
  page: number
  search: string
}

export type UseWebhooksResult = {
  data: WebhookList | null
  /** Params that `data` was loaded for (null until first success). */
  dataQuery: WebhooksQuery | null
  isLoading: boolean
  isInitialLoading: boolean
  error: ApiError | null
  refetch: () => void
}

export function useWebhooks({
  page,
  limit,
  search,
}: GetWebhooksParams): UseWebhooksResult {
  const normalizedSearch = search ?? ''
  const [data, setData] = useState<WebhookList | null>(null)
  const [dataQuery, setDataQuery] = useState<WebhooksQuery | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setError(null)

    void getWebhooks({ page, limit, search: normalizedSearch })
      .then((response) => {
        if (cancelled) {
          return
        }

        setData(response)
        setDataQuery({ page, search: normalizedSearch })
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
  }, [page, limit, normalizedSearch, reloadToken])

  return {
    data,
    dataQuery,
    isLoading,
    isInitialLoading: isLoading && data === null,
    error,
    refetch: () => {
      setReloadToken((value) => value + 1)
    },
  }
}
