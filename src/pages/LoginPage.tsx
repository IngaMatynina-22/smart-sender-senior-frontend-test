import { Navigate } from 'react-router'
import { useAuth } from '../features/auth/model/useAuth.ts'
import { LoginForm } from '../features/auth/ui/LoginForm.tsx'

export function LoginPage() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/webhooks" replace />
  }

  return <LoginForm />
}
