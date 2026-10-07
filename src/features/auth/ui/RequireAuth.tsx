import { Navigate } from 'react-router'
import type { ReactNode } from 'react'
import { useAuth } from '../model/useAuth.ts'

type RequireAuthProps = {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
