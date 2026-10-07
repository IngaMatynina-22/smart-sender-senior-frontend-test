import { Navigate } from 'react-router'
import { useAuth } from '../features/auth/model/useAuth.ts'

export function HomeRedirect() {
  const { isAuthenticated } = useAuth()

  return <Navigate to={isAuthenticated ? '/webhooks' : '/login'} replace />
}
