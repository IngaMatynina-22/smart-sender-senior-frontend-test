import type { ReactNode } from 'react'
import { AuthProvider } from '../features/auth/model/AuthProvider.tsx'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>
}
