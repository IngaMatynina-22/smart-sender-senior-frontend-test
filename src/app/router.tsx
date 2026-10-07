import { createBrowserRouter, Navigate } from 'react-router'
import { RequireAuth } from '../features/auth/ui/RequireAuth.tsx'
import { LoginPage } from '../pages/LoginPage.tsx'
import { WebhooksPage } from '../pages/WebhooksPage.tsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/webhooks" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/webhooks',
    element: (
      <RequireAuth>
        <WebhooksPage />
      </RequireAuth>
    ),
  },
])
