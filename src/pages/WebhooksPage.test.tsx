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
import { handlers } from '../mocks/browser.ts'
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
        element: <WebhooksPage />,
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
  server.resetHandlers()
  requestedUrls.length = 0
  startSession()
})

afterEach(() => {
  cleanup()
  resetSession()
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

  it('does not crash when page is beyond search results', async () => {
    renderWebhooksPage('/webhooks?page=5&search=payment')

    await waitFor(() => {
      expect(screen.getByText('No webhooks found.')).toBeTruthy()
    })

    expect(screen.getByLabelText('Search webhooks')).toHaveProperty(
      'value',
      'payment',
    )
    expect(screen.queryByText('Failed to load webhooks.')).toBeNull()
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
