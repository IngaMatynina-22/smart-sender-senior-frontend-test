import { Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { useAuth } from '../model/useAuth.ts'

type RequireAuthProps = {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`
    const loginPath = `/login?next=${encodeURIComponent(next)}`

    return <Navigate to={loginPath} replace />
  }

  return children
}
