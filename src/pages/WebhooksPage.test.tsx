import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
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
  resetSession()
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
