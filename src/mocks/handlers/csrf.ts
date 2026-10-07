import { http, HttpResponse } from 'msw'
import { getMockCsrfToken } from '../csrf.ts'
import { validateRequestedWith } from '../requestedWith.ts'

const CSRF_TOKEN_HEADER = 'X-CSRF-TOKEN'

export const csrfHandlers = [
  http.get('/csrf', ({ request }) => {
    const requestedWithError = validateRequestedWith(request)

    if (requestedWithError) {
      return requestedWithError
    }

    return new HttpResponse(null, {
      status: 204,
      headers: {
        [CSRF_TOKEN_HEADER]: getMockCsrfToken(),
      },
    })
  }),
]
