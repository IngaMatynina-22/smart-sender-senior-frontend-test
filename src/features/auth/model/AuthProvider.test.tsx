import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
import { clearCsrfToken } from '../../../infrastructure/api/csrf.ts'
import { handlers } from '../../../mocks/browser.ts'
import { resetCsrfState } from '../../../mocks/csrf.ts'
import { resetSession } from '../../../mocks/session.ts'
import { AuthProvider } from './AuthProvider.tsx'
import { useAuth } from './useAuth.ts'

const server = setupServer(...handlers)

function AuthProbe() {
  const { user, isAuthenticated, login, logout } = useAuth()

  return (
    <div>
      <div data-testid="auth-state">
        {isAuthenticated ? 'authenticated' : 'anonymous'}
      </div>
      <div data-testid="user-email">{user?.email ?? ''}</div>
      <button
        type="button"
        onClick={() => {
          void login('test@example.com', 'password123')
        }}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => {
          void logout()
        }}
      >
        Logout
      </button>
    </div>
  )
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterAll(() => {
  server.close()
})

beforeEach(() => {
  resetSession()
  resetCsrfState()
  clearCsrfToken()
  server.resetHandlers()
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  resetSession()
  resetCsrfState()
  clearCsrfToken()
  localStorage.clear()
})

describe('AuthProvider logout', () => {
  it('revokes the session and clears user state', async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    screen.getByRole('button', { name: 'Login' }).click()

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe(
        'authenticated',
      )
      expect(screen.getByTestId('user-email').textContent).toBe(
        'test@example.com',
      )
    })

    screen.getByRole('button', { name: 'Logout' }).click()

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('anonymous')
      expect(screen.getByTestId('user-email').textContent).toBe('')
    })

    const meResponse = await fetch('/v1/me')
    expect(meResponse.status).toBe(401)
  })
})
