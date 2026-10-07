import { setupWorker } from 'msw/browser'
import { handlers } from './browser.ts'

export const worker = setupWorker(...handlers)
