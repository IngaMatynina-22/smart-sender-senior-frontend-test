import { http, HttpResponse } from 'msw'
import { webhooks } from '../data.ts'
import { isSessionActive } from '../session.ts'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

function parsePositiveInt(value: string | null, fallback: number): number {
  if (value === null || value.trim() === '') {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

export const webhooksHandlers = [
  http.get('/v1/webhooks', ({ request }) => {
    if (!isSessionActive()) {
      return new HttpResponse(null, { status: 401 })
    }

    const url = new URL(request.url)
    const page = parsePositiveInt(url.searchParams.get('page'), DEFAULT_PAGE)
    const limit = parsePositiveInt(url.searchParams.get('limit'), DEFAULT_LIMIT)
    const search = url.searchParams.get('search')?.trim() ?? ''

    const filtered =
      search === ''
        ? webhooks
        : webhooks.filter((webhook) =>
            webhook.name.toLowerCase().includes(search.toLowerCase()),
          )

    const total = filtered.length
    const last = total === 0 ? 1 : Math.ceil(total / limit)
    const start = (page - 1) * limit
    const data = filtered.slice(start, start + limit)

    return HttpResponse.json({
      data,
      paging: {
        pages: {
          current: page,
          last,
        },
        results: {
          total,
          limitation: limit,
        },
      },
    })
  }),
]
