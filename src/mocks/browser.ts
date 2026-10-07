import { authHandlers } from './handlers/auth.ts'
import { csrfHandlers } from './handlers/csrf.ts'
import { webhooksHandlers } from './handlers/webhooks.ts'

export const handlers = [...authHandlers, ...csrfHandlers, ...webhooksHandlers]
