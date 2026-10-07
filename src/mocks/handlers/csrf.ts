import { http, HttpResponse } from 'msw'
import { getMockCsrfToken } from '../csrf.ts'

const CSRF_TOKEN_HEADER = 'X-CSRF-TOKEN'

export const csrfHandlers = [
  http.get('/csrf', () => {
    return new HttpResponse(null, {
      status: 204,
      headers: {
        [CSRF_TOKEN_HEADER]: getMockCsrfToken(),
      },
    })
  }),
]
