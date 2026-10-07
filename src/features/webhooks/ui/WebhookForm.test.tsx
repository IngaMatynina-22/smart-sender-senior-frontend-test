import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { handlers } from '../../../mocks/browser.ts'
import { resetWebhooks } from '../../../mocks/data.ts'
import { resetSession, startSession } from '../../../mocks/session.ts'
import type { Webhook } from '../model/types.ts'
import { WebhookForm } from './WebhookForm.tsx'

const server = setupServer(...handlers)
const requestedMethods: string[] = []

function onRequestStart(event: { request: Request }) {
  if (event.request.url.includes('/v1/webhooks/')) {
    requestedMethods.push(event.request.method)
  }
}

const webhook: Webhook = {
  id: 1,
  name: 'Order Created',
  url: 'https://hooks.example.com/orders/created',
  active: true,
  created_at: '2025-01-03T08:15:00.000Z',
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
  server.resetHandlers()
  requestedMethods.length = 0
  startSession()
})

afterEach(() => {
  cleanup()
  resetSession()
  resetWebhooks()
})

describe('WebhookForm', () => {
  it('loads initial values and saves updates', async () => {
    const onSuccess = vi.fn()

    render(
      <WebhookForm
        webhook={webhook}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Name')).toHaveProperty(
      'value',
      'Order Created',
    )
    expect(screen.getByLabelText('URL')).toHaveProperty(
      'value',
      'https://hooks.example.com/orders/created',
    )

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Order Created Edited' },
    })
    fireEvent.change(screen.getByLabelText('URL'), {
      target: { value: 'https://hooks.example.com/orders/created-edited' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'Order Created Edited',
          url: 'https://hooks.example.com/orders/created-edited',
        }),
      )
    })

    expect(requestedMethods).toContain('PUT')
  })

  it('shows server validation errors next to Name and URL', async () => {
    render(
      <WebhookForm
        webhook={webhook}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('URL'), {
      target: { value: 'not-a-url' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByText('The name field is required.')).toBeTruthy()
      expect(screen.getByText('The url must be a valid URL.')).toBeTruthy()
    })
  })

  it('does not send PUT when Cancel is clicked', () => {
    const onCancel = vi.fn()

    render(
      <WebhookForm
        webhook={webhook}
        onSuccess={vi.fn()}
        onCancel={onCancel}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(requestedMethods).not.toContain('PUT')
  })
})
