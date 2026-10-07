import { http, HttpResponse } from 'msw'
import type { ValidationError } from '../../shared/api/validationError.ts'
import { validateCsrf } from '../csrf.ts'
import {
  authenticationErrorResponse,
  notFoundErrorResponse,
  validationErrorResponse,
} from '../errors.ts'
import { webhooks } from '../data.ts'
import { validateRequestedWith } from '../requestedWith.ts'
import { isSessionActive } from '../session.ts'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

type UpdateWebhookBody = {
  name?: unknown
  url?: unknown
}

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

function parseWebhookId(value: string): number | null {
  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed < 1 || String(parsed) !== value) {
    return null
  }

  return parsed
}

function findWebhookIndex(id: number): number {
  return webhooks.findIndex((webhook) => webhook.id === id)
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export const webhooksHandlers = [
  http.get('/v1/webhooks', ({ request }) => {
    const requestedWithError = validateRequestedWith(request)

    if (requestedWithError) {
      return requestedWithError
    }

    if (!isSessionActive()) {
      return authenticationErrorResponse()
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
    const current = Math.min(page, last)
    const start = (current - 1) * limit
    const data = filtered.slice(start, start + limit)

    return HttpResponse.json({
      data,
      paging: {
        pages: {
          current,
          last,
        },
        results: {
          total,
          limitation: limit,
        },
      },
    })
  }),

  http.get('/v1/webhooks/:id', ({ params, request }) => {
    const requestedWithError = validateRequestedWith(request)

    if (requestedWithError) {
      return requestedWithError
    }

    if (!isSessionActive()) {
      return authenticationErrorResponse()
    }

    const id = parseWebhookId(String(params.id))

    if (id === null) {
      return notFoundErrorResponse('Webhook not found.')
    }

    const webhook = webhooks.find((item) => item.id === id)

    if (!webhook) {
      return notFoundErrorResponse('Webhook not found.')
    }

    return HttpResponse.json(webhook)
  }),

  http.put('/v1/webhooks/:id', async ({ params, request }) => {
    const requestedWithError = validateRequestedWith(request)

    if (requestedWithError) {
      return requestedWithError
    }

    const csrfError = validateCsrf(request)

    if (csrfError) {
      return csrfError
    }

    if (!isSessionActive()) {
      return authenticationErrorResponse()
    }

    const id = parseWebhookId(String(params.id))

    if (id === null) {
      return notFoundErrorResponse('Webhook not found.')
    }

    const index = findWebhookIndex(id)

    if (index === -1) {
      return notFoundErrorResponse('Webhook not found.')
    }

    let body: UpdateWebhookBody

    try {
      body = (await request.json()) as UpdateWebhookBody
    } catch {
      return validationErrorResponse({
        name: ['The name field is required.'],
        url: ['The url must be a valid URL.'],
      })
    }

    const payload: ValidationError['error']['payload'] = {}
    const name = typeof body.name === 'string' ? body.name : ''
    const url = typeof body.url === 'string' ? body.url : ''

    if (name.trim() === '') {
      payload.name = ['The name field is required.']
    }

    if (!isValidHttpUrl(url)) {
      payload.url = ['The url must be a valid URL.']
    }

    if (Object.keys(payload).length > 0) {
      return validationErrorResponse(payload)
    }

    const updated = {
      ...webhooks[index],
      name,
      url,
    }

    webhooks[index] = updated

    return HttpResponse.json(updated)
  }),
]
