import { createContext, type ReactNode } from 'react'

export type AuthState = {
  user: null
  login: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

const authState: AuthState = {
  user: null,
  login: async () => {
    return
  },
  logout: async () => {
    return
  },
}

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <AuthContext value={authState}>{children}</AuthContext>
}
