import { useEffect, useState } from 'react'
import { ApiError } from '../../../infrastructure/api/client.ts'
import { getWebhook } from '../api.ts'
import type { Webhook } from './types.ts'

export type UseWebhookResult = {
  data: Webhook | null
  isLoading: boolean
  error: ApiError | null
}

export function useWebhook(id: number | null): UseWebhookResult {
  const [data, setData] = useState<Webhook | null>(null)
  const [isLoading, setIsLoading] = useState(id !== null)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    if (id === null) {
      setData(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    setData(null)
    setIsLoading(true)
    setError(null)

    void getWebhook(id)
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
  }, [id])

  return {
    data,
    isLoading,
    error,
  }
}
