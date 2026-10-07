import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  getMe,
  issueDeviceSession,
  login as loginRequest,
} from '../api.ts'
import type { User } from './types.ts'

export type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, captchaToken: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const loginInFlightRef = useRef(false)

  const login = useCallback(
    async (email: string, password: string, captchaToken: string) => {
      if (loginInFlightRef.current) {
        return
      }

      loginInFlightRef.current = true
      setIsLoading(true)

      try {
        const { device_session_token } = await loginRequest(
          email,
          password,
          captchaToken,
        )
        await issueDeviceSession(device_session_token)
        const currentUser = await getMe()
        setUser(currentUser)
      } finally {
        loginInFlightRef.current = false
        setIsLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(() => {
    setUser(null)
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
