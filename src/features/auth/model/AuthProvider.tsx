import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { clearCsrfToken } from '../../../infrastructure/api/csrf.ts'
import {
  clearSessionExpiredNotification,
  registerSessionExpiredHandler,
} from '../../../infrastructure/api/sessionExpired.ts'
import {
  getMe,
  issueDeviceSession,
  login as loginRequest,
  revokeSession,
} from '../api.ts'
import type { User } from './types.ts'

export type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const loginInFlightRef = useRef(false)

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setUser(null)
      clearCsrfToken()
    })

    return () => {
      registerSessionExpiredHandler(null)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    if (loginInFlightRef.current) {
      return
    }

    loginInFlightRef.current = true
    setIsLoading(true)

    try {
      const { device_session_token } = await loginRequest(email, password)
      await issueDeviceSession(device_session_token)
      const currentUser = await getMe()
      clearSessionExpiredNotification()
      setUser(currentUser)
    } finally {
      loginInFlightRef.current = false
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await revokeSession()
    } catch {
      // Always clear local auth state even if revoke fails.
    } finally {
      clearCsrfToken()
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
