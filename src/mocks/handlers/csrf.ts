import { http, HttpResponse } from 'msw'

const MOCK_CSRF_TOKEN = 'mock-csrf-token'

export const csrfHandlers = [
  http.get('/csrf', () => {
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'X-CSRF-TOKEN': MOCK_CSRF_TOKEN,
      },
    })
  }),
]
