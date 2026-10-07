export type ValidationError = {
  error: {
    type: 'ValidationException'
    message: string
    payload: Record<string, string[]>
  }
}
