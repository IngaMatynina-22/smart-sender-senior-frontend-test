import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'

async function enableMocking() {
  const { worker } = await import('./mocks/worker.ts')

  await worker.start({
    onUnhandledFrame: 'bypass',
  })
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
