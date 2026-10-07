import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import { AuthProvider } from '../features/auth/model/AuthProvider.tsx'
import { clearCsrfToken } from '../infrastructure/api/csrf.ts'
import { handlers } from '../mocks/browser.ts'
import { resetCsrfState } from '../mocks/csrf.ts'
import { resetWebhooks, webhooks } from '../mocks/data.ts'
import { resetSession, startSession } from '../mocks/session.ts'
import { WebhooksPage } from './WebhooksPage.tsx'

const server = setupServer(...handlers)
const requestedUrls: string[] = []

function onRequestStart(event: { request: Request }) {
  requestedUrls.push(event.request.url)
}

function renderWebhooksPage(initialEntry = '/webhooks?page=1') {
  const router = createMemoryRouter(
    [
      {
        path: '/webhooks',
        element: (
          <AuthProvider>
            <WebhooksPage />
          </AuthProvider>
        ),
      },
    ],
    {
      initialEntries: [initialEntry],
    },
  )

  render(<RouterProvider router={router} />)

  return router
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  server.events.on('request:start', onRequestStart)
})

afterAll(() => {
  server.events.removeListener('request:start', onRequestStart)
  server.close()
})

beforeEach(() => {
  resetSession()
  resetWebhooks()
  resetCsrfState()
  clearCsrfToken()
  server.resetHandlers()
  requestedUrls.length = 0
  startSession()
})

afterEach(() => {
  cleanup()
  resetSession()
  resetWebhooks()
  resetCsrfState()
  clearCsrfToken()
})

describe('WebhooksPage list states', () => {
  it('shows loading state while webhooks are requested', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    server.use(
      http.get('/v1/webhooks', async () => {
        await gate
        return HttpResponse.json({
          data: [],
          paging: {
            pages: {
              current: 1,
              last: 1,
            },
            results: {
              total: 0,
              limitation: 10,
            },
          },
        })
      }),
    )

    renderWebhooksPage('/webhooks?page=1')

    expect(screen.getByText('Loading webhooks...')).toBeTruthy()
    expect(screen.queryByText('No webhooks found.')).toBeNull()
    expect(screen.queryByText('Failed to load webhooks.')).toBeNull()
    expect(screen.queryByText('Order Created')).toBeNull()

    release()

    await waitFor(() => {
      expect(screen.queryByText('Loading webhooks...')).toBeNull()
    })
  })

  it('shows error state when the webhooks request fails', async () => {
    server.use(
      http.get('/v1/webhooks', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderWebhooksPage('/webhooks?page=1')

    await waitFor(() => {
      expect(screen.getByText('Failed to load webhooks.')).toBeTruthy()
    })

    expect(screen.queryByText('Loading webhooks...')).toBeNull()
    expect(screen.queryByText('No webhooks found.')).toBeNull()
    expect(screen.queryByText('Order Created')).toBeNull()
  })

  it('shows empty state for a successful search with no results', async () => {
    renderWebhooksPage('/webhooks?page=1&search=zzzz-no-match')

    await waitFor(() => {
      expect(screen.getByText('No webhooks found.')).toBeTruthy()
    })

    expect(screen.queryByText('Loading webhooks...')).toBeNull()
    expect(screen.queryByText('Failed to load webhooks.')).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByLabelText('Search webhooks')).toHaveProperty(
      'value',
      'zzzz-no-match',
    )
  })

  it('shows the webhook table for a successful list and not the empty state', async () => {
    renderWebhooksPage('/webhooks?page=1')

    await waitFor(() => {
      expect(screen.getByText('Order Created')).toBeTruthy()
    })

    expect(screen.getByRole('table')).toBeTruthy()
    expect(screen.queryByText('No webhooks found.')).toBeNull()
    expect(screen.queryByText('Loading webhooks...')).toBeNull()
    expect(screen.queryByText('Failed to load webhooks.')).toBeNull()
  })

  it('clamps page when it is beyond search results', async () => {
    const router = renderWebhooksPage('/webhooks?page=5&search=payment')

    await waitFor(() => {
      expect(screen.getByText('Payment Completed')).toBeTruthy()
      expect(router.state.location.search).toBe('?page=1&search=payment')
    })

    expect(screen.getByLabelText('Search webhooks')).toHaveProperty(
      'value',
      'payment',
    )
    expect(screen.queryByText('Failed to load webhooks.')).toBeNull()
  })
})

describe('WebhooksPage edit webhook', () => {
  it('opens edit dialog, loads form, saves, and refreshes the list', async () => {
    renderWebhooksPage('/webhooks?page=1')

    await waitFor(() => {
      expect(screen.getByText('Order Created')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Edit Order Created' }))

    await waitFor(() => {
      expect(screen.getByText('Edit webhook')).toBeTruthy()
      expect(screen.getByLabelText('Name')).toHaveProperty(
        'value',
        'Order Created',
      )
      expect(screen.getByLabelText('URL')).toHaveProperty(
        'value',
        'https://hooks.example.com/orders/created',
      )
    })

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Order Created From List' },
    })
    fireEvent.change(screen.getByLabelText('URL'), {
      target: { value: 'https://hooks.example.com/orders/from-list' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.queryByText('Edit webhook')).toBeNull()
      expect(screen.getByText('Order Created From List')).toBeTruthy()
      expect(
        screen.getByText('https://hooks.example.com/orders/from-list'),
      ).toBeTruthy()
    })
  })

  it('shows loading then field validation errors in the edit dialog', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    server.use(
      http.get('/v1/webhooks/:id', async ({ params }) => {
        await gate
        const webhook = webhooks.find(
          (item) => item.id === Number(params.id),
        )

        if (!webhook) {
          return new HttpResponse(null, { status: 404 })
        }

        return HttpResponse.json(webhook)
      }),
    )

    renderWebhooksPage('/webhooks?page=1')

    await waitFor(() => {
      expect(screen.getByText('Order Created')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Edit Order Created' }))

    expect(screen.getByText('Loading webhook...')).toBeTruthy()

    release()

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toBeTruthy()
    })

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByText('The name field is required.')).toBeTruthy()
    })
  })

  it('does not send PUT when Cancel is clicked', async () => {
    const putUrls: string[] = []

    function onPutRequest(event: { request: Request }) {
      if (event.request.method === 'PUT') {
        putUrls.push(event.request.url)
      }
    }

    server.events.on('request:start', onPutRequest)

    try {
      renderWebhooksPage('/webhooks?page=1')

      await waitFor(() => {
        expect(screen.getByText('Order Created')).toBeTruthy()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Edit Order Created' }))

      await waitFor(() => {
        expect(screen.getByLabelText('Name')).toBeTruthy()
      })

      fireEvent.change(screen.getByLabelText('Name'), {
        target: { value: 'Should Not Persist' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      await waitFor(() => {
        expect(screen.queryByText('Edit webhook')).toBeNull()
      })

      expect(putUrls).toEqual([])
      expect(screen.getByText('Order Created')).toBeTruthy()
      expect(screen.queryByText('Should Not Persist')).toBeNull()
    } finally {
      server.events.removeListener('request:start', onPutRequest)
    }
  })
})

describe('WebhooksPage back/forward navigation', () => {
  it('restores page and search from history and refetches webhooks', async () => {
    const router = renderWebhooksPage('/webhooks?page=1')

    await waitFor(() => {
      expect(screen.getByText('Order Created')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))

    await waitFor(() => {
      expect(router.state.location.search).toBe('?page=2')
      expect(screen.getByText('Invoice Paid')).toBeTruthy()
    })

    fireEvent.change(screen.getByLabelText('Search webhooks'), {
      target: { value: 'payment' },
    })

    await waitFor(() => {
      expect(router.state.location.search).toBe('?page=1&search=payment')
      expect(screen.getByText('Payment Completed')).toBeTruthy()
      expect(screen.queryByText('Invoice Paid')).toBeNull()
    })

    requestedUrls.length = 0

    await router.navigate(-1)

    await waitFor(() => {
      expect(router.state.location.search).toBe('?page=2')
      expect(screen.getByText('Invoice Paid')).toBeTruthy()
      expect(screen.getByLabelText('Search webhooks')).toHaveProperty(
        'value',
        '',
      )
    })

    expect(
      requestedUrls.some((url) => url.includes('/v1/webhooks?page=2&limit=10')),
    ).toBe(true)

    requestedUrls.length = 0

    await router.navigate(1)

    await waitFor(() => {
      expect(router.state.location.search).toBe('?page=1&search=payment')
      expect(screen.getByText('Payment Completed')).toBeTruthy()
      expect(screen.getByLabelText('Search webhooks')).toHaveProperty(
        'value',
        'payment',
      )
    })

    expect(
      requestedUrls.some((url) =>
        url.includes('/v1/webhooks?page=1&limit=10&search=payment'),
      ),
    ).toBe(true)
  })
})
