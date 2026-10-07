import { Navigate, useSearchParams } from 'react-router'
import { useAuth } from '../features/auth/model/useAuth.ts'
import { LoginForm } from '../features/auth/ui/LoginForm.tsx'
import { getSafePostLoginPath } from '../shared/lib/safeRedirect.ts'

export function LoginPage() {
  const { isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()

  if (isAuthenticated) {
    return (
      <Navigate
        to={getSafePostLoginPath(searchParams.get('next'))}
        replace
      />
    )
  }

  return <LoginForm />
}
