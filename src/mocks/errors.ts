import { HttpResponse } from 'msw'
import type { ValidationError } from '../shared/api/validationError.ts'

export function validationErrorResponse(
  payload: ValidationError['error']['payload'],
) {
  const body: ValidationError = {
    error: {
      type: 'ValidationException',
      message: 'The given data was invalid.',
      payload,
    },
  }

  return HttpResponse.json(body, { status: 422 })
}

export function badRequestResponse(message = 'Bad request.') {
  return HttpResponse.json(
    {
      error: {
        type: 'BadRequestException',
        message,
      },
    },
    { status: 400 },
  )
}

export function authenticationErrorResponse(message = 'Unauthenticated.') {
  return HttpResponse.json(
    {
      error: {
        type: 'AuthenticationException',
        message,
      },
    },
    { status: 401 },
  )
}

export function notFoundErrorResponse(message = 'Not found.') {
  return HttpResponse.json(
    {
      error: {
        type: 'NotFoundException',
        message,
      },
    },
    { status: 404 },
  )
}
