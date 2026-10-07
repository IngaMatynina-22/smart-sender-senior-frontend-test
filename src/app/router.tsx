import { createBrowserRouter } from 'react-router'
import { RequireAuth } from '../features/auth/ui/RequireAuth.tsx'
import { LoginPage } from '../pages/LoginPage.tsx'
import { WebhooksPage } from '../pages/WebhooksPage.tsx'
import { HomeRedirect } from './HomeRedirect.tsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeRedirect />,
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
