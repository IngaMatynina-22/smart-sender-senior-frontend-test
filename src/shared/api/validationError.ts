export type ValidationError = {
  error: {
    type: 'ValidationException'
    message: string
    payload: Record<string, string[]>
  }
}

export function isValidationError(body: unknown): body is ValidationError {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return false
  }

  const error = body.error

  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'ValidationException' &&
    'payload' in error &&
    typeof error.payload === 'object' &&
    error.payload !== null
  )
}
