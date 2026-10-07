import { createBrowserRouter } from 'react-router'
import { LoginPage } from '../pages/LoginPage.tsx'
import { WebhooksPage } from '../pages/WebhooksPage.tsx'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/webhooks',
    element: <WebhooksPage />,
  },
])
